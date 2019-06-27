import GoogleIntegration from './GoogleIntegration'

export function attach(runtime, options = {}) {
  if (runtime.isFeatureEnabled('google')) {
    return
  }

  runtime.features.register('google', () => GoogleIntegration)

  runtime.feature('google').enable({
    ...options,
    ...options.google || {}
  }).then(() => {
    runtime.debug(`Google Integration Enabled`, {
      serviceAccountEmail: runtime.google.serviceAccountEmail,
      projectId: runtime.google.settings.googleProject
    })
  })
}
