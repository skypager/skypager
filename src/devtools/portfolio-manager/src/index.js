import skypager from '@skypager/node'
import PortfolioManager from './features/portfolio-manager'

export default PortfolioManager

export function attach(runtime = skypager) {
  runtime.features.register('portfolio-manager', () => PortfolioManager)
  runtime.feature('portfolio-manager').enable()
}
