import gql from 'graphql-tag'

export const typeDefs = gql`
  scalar JSON

  type Schema {
    query: Query
  }

  type Query {
    packages: [Package]
  }

  # As far as i can tell, there is no key/value pair attribute type in GraphQL
  # So I have to convert the dependencies hash in package.json to an array of
  # objects.  This actually makes turning the package.jsons in our portfolio into
  # a graph structure easier, so it makes sense.
  type Dependency {
    # the type of dependency relationship
    type: String
    # the package which has the dependency
    source: Package
    # the package which is depended on
    target: Package
    # the version requirement of the dependency
    version: String
  }

  type Script {
    name: String
    value: String
  }

  type Author {
    name: String
    email: String
  }

  type Repository {
    location: String
    type: String
  }

  type Release {
    timestamp: String
    version: String
  }

  # This is based on the package.json contents of an npm module
  type Package {
    name: String
    version: String
    description: String
    homepage: String
    dependencies: [Dependency]
    devDependencies: [Dependency]
    keywords: [String]
    scripts: JSON
    authors: [Author]
    repository: Repository
    releases: [Release]
    skypager: JSON
  }
`
