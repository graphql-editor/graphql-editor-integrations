type IntegrationData = {
  name: string;
  description: string;
  value: string | string[];
  required?: boolean;
};

type IntegrationSpecification = {
  [resolver: string]: {
    name: string;
    description: string;
    data: Record<string, IntegrationData>;
    resolve: { name: string };
  };
};

// Declare your resolver specifications here to generate JSON from it later using `gei integrate` command
const integration: IntegrationSpecification = {
  ['Query.pipe']: {
    data: {},
    description: 'Pass the resolver and go furhter',
    name: 'Pipe resolver',
    resolve: {
      name: 'lib/Query/pipe',
    },
  },
  ['Query.passSource']: {
    data: {},
    description: 'Pass the resolver and go furhter. Pass the source to the next resolver',
    name: 'Pass the source resolver',
    resolve: {
      name: 'lib/Query/passSource',
    },
  },
};

export default integration;
