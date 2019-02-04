import gql from 'graphql-tag'

export const typeDefs = gql`
  type Schema {
    query: Query
  }

  type Query {
    packages: [Package]
  }

  type Dependency {
    # the type of dependency relationship
    type: String
    # the package which has the dependency
    source: Package
    # the package which is depended on
    target: Package

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
    scripts: [Script]
    authors: [Author]
    repository: Repository
    releases: [Release]
  }
`
