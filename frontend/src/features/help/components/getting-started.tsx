import { Link } from 'react-router-dom';

const steps = [
  {
    title: 'Add Locations',
    description: 'Define the checkpoints and stops for your races.',
    linkText: 'Add a location',
    linkTo: '/locations/new',
  },
  {
    title: 'Geocode Locations',
    description:
      'Ensure all locations have latitude/longitude coordinates so distances can be calculated.',
    linkText: 'View locations',
    linkTo: '/locations',
  },
  {
    title: 'Create a Race',
    description:
      'Configure race settings like distance range, number of stops, and select locations from your pool.',
    linkText: 'Create a race',
    linkTo: '/races/new',
  },
  {
    title: 'Generate Routes',
    description:
      'From a race detail page, use the operations panel to generate optimized routes for each team.',
  },
  {
    title: 'Review Routes',
    description:
      'View generated routes, inspect legs and distances, and export to CSV for race day.',
  },
];

export function GettingStarted() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Getting Started</h1>
      <p className="text-gray-600 mb-8">
        Cartographer helps you plan race routes. Follow these steps to get up and running.
      </p>

      <ol className="space-y-6">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
              {index + 1}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
              <p className="text-gray-600 mt-0.5">{step.description}</p>
              {step.linkTo && (
                <Link
                  to={step.linkTo}
                  className="inline-block mt-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {step.linkText} &rarr;
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
