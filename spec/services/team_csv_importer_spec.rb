# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TeamCsvImporter do
  let(:race) { FactoryBot.create(:race) }

  it 'imports teams from CSV with number and name columns' do
    csv = "number,name\n1,Alpha Team\n2,Bravo Team\n"
    result = TeamCsvImporter.call(race, csv)

    expect(result[:imported]).to eq(2)
    expect(result[:skipped]).to eq(0)
    expect(result[:total]).to eq(2)
    expect(race.teams.count).to eq(2)
    expect(race.teams.find_by(bib_number: 1).name).to eq("Alpha Team")
  end

  it 'auto-detects column names case-insensitively' do
    csv = "Number,Name\n5,Case Team\n"
    result = TeamCsvImporter.call(race, csv)
    expect(result[:imported]).to eq(1)
  end

  it 'raises error when required columns are missing' do
    csv = "id,team_name\n1,Foo\n"
    expect {
      TeamCsvImporter.call(race, csv)
    }.to raise_error(TeamCsvImporter::ImportError, /number.*name/i)
  end

  it 'skips rows with invalid bib numbers' do
    csv = "number,name\n0,Bad Bib\n-1,Negative\n1,Good Team\n"
    result = TeamCsvImporter.call(race, csv)
    expect(result[:imported]).to eq(1)
    expect(result[:skipped]).to eq(2)
  end

  it 'skips rows with blank names' do
    csv = "number,name\n1,\n2,Valid Team\n"
    result = TeamCsvImporter.call(race, csv)
    expect(result[:imported]).to eq(1)
    expect(result[:skipped]).to eq(1)
  end

  it 'upserts on re-import (updates name for existing bib)' do
    FactoryBot.create(:team, race: race, bib_number: 1, name: "Old Name")
    csv = "number,name\n1,New Name\n"
    result = TeamCsvImporter.call(race, csv)

    expect(result[:imported]).to eq(1)
    expect(race.teams.count).to eq(1)
    expect(race.teams.find_by(bib_number: 1).name).to eq("New Name")
  end
end
