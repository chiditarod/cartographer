# frozen_string_literal: true

require 'rails_helper'

RSpec.describe JobStatus, type: :model do
  subject { JobStatus.create!(job_type: 'test', status: 'pending', total: 10) }

  describe 'validations' do
    it 'requires job_type' do
      js = JobStatus.new(status: 'pending')
      expect(js).not_to be_valid
      expect(js.errors[:job_type]).to include("can't be blank")
    end

    it 'validates status inclusion' do
      js = JobStatus.new(job_type: 'test', status: 'invalid')
      expect(js).not_to be_valid
    end

    it 'allows valid statuses' do
      %w[pending running completed failed].each do |status|
        js = JobStatus.new(job_type: 'test', status: status)
        expect(js).to be_valid
      end
    end
  end

  describe '#percent_complete' do
    it 'returns 0 when total is zero' do
      subject.update!(total: 0)
      expect(subject.percent_complete).to eq(0)
    end

    it 'calculates percentage' do
      subject.update!(progress: 5, total: 10)
      expect(subject.percent_complete).to eq(50.0)
    end
  end

  describe '#complete!' do
    it 'sets status to completed' do
      subject.complete!(message: 'Done')
      expect(subject.reload.status).to eq('completed')
      expect(subject.message).to eq('Done')
      expect(subject.progress).to eq(subject.total)
    end
  end

  describe '#fail!' do
    it 'sets status to failed' do
      subject.fail!(message: 'Error occurred')
      expect(subject.reload.status).to eq('failed')
      expect(subject.message).to eq('Error occurred')
    end
  end

  describe '#tick!' do
    it 'increments progress' do
      subject.update!(progress: 3)
      subject.tick!
      expect(subject.reload.progress).to eq(4)
    end

    it 'updates message if provided' do
      subject.tick!(message: 'Step 1')
      expect(subject.reload.message).to eq('Step 1')
    end
  end
end
