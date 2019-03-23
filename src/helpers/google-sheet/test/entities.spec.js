import runtime from '@skypager/node'
import * as SheetHelper from '../src'

runtime.use(SheetHelper, {
  serviceAccount: runtime.resolve('secrets', 'serviceAccount.json'),
  googleProject: runtime.fsx.readJsonSync(runtime.resolve('secrets', 'serviceAccount.json'))
    .project_id,
})

describe('The Sheets Helper', function() {
  let sheetHelper

  before(async function() {
    await runtime.sheets.discover()
  })

  it('has an api for loading worksheets', async function() {
    sheetHelper = runtime.sheet('skypagersheethelperfixture2')
    await sheetHelper.loadAll()

    sheetHelper.worksheetIds.should.be.an('array').that.is.not.empty
    sheetHelper.worksheetTitles.should.include('Sheet1', 'Sheet2')
  })

  it('can load all of the cells found in a sheet', async function() {
    const sheet1 = await sheetHelper.sheet('sheet1')

    await sheet1.indexCells()
    sheet1.cells.should.be.an('array').that.is.not.empty
  })

  it('creates an index of cells position by column number', function() {
    const sheet1 = sheetHelper.sheet('sheet1')
    sheet1.should.have.property('columns')
    sheet1.rows
      .get(1)
      .should.be.an('array')
      .that.has.property('length', 5)
  })

  it('creates an index of cells position by row number', function() {
    const sheet1 = sheetHelper.sheet('sheet1')
    sheet1.should.have.property('rows')
    sheet1.rows
      .get(1)
      .should.be.an('array')
      .that.has.property('length', 5)
  })

  it('maintains metadata about the column headers', function() {
    const sheet1 = sheetHelper.sheet('sheet1')
    const { headersMap } = sheet1

    headersMap.should.have
      .property('columnOne')
      .that.is.an('object')
      .with.property('col', 1)

    headersMap.columnOne.should.have.property('attribute', 'columnOne')
    headersMap.columnOne.should.have.property('value', 'column-one')

    headersMap.should.have
      .property('columnTwo')
      .that.is.an('object')
      .with.property('col', 2)
    headersMap.should.have
      .property('columnThree')
      .that.is.an('object')
      .with.property('col', 3)
    headersMap.should.have
      .property('columnFour')
      .that.is.an('object')
      .with.property('col', 4)
    headersMap.should.have
      .property('columnFive')
      .that.is.an('object')
      .with.property('col', 5)
  })

  it('can tell us which row entity class is assigned to a sheet', function() {
    const { RowEntity } = sheetHelper
    sheetHelper.should.have.property('RowEntity')

    sheetHelper.getEntityClass('sheet1').should.equal(RowEntity)
  })

  it('creates row entities', function() {
    const sheet1 = sheetHelper.sheet('sheet1')
    sheet1.dataRows.length.should.equal(4)
    sheet1.entities.should.be.an('array').that.has.property('length', 4)
    const entity = sheet1.entities[0]
    entity.should.have.property('columnOne').that.is.a('string').that.is.not.empty
    entity.should.have.property('columnTwo').that.is.a('string').that.is.not.empty
    entity.should.have.property('columnThree').that.is.a('string').that.is.not.empty
    entity.should.have.property('columnFour').that.is.a('string').that.is.not.empty
    entity.should.have.property('columnFive').that.is.a('string').that.is.not.empty
  })

  it('supports custom RowEntity classes', async function() {
    class CustomEntity extends sheetHelper.RowEntity {
      get customProperty() {
        return 'custom'
      }
    }

    sheetHelper.registerEntity('sheet2', () => CustomEntity)

    const sheet2 = await sheetHelper.ws('sheet2')

    sheet2.entities[0].should.have.property('customProperty', 'custom')
  })
})
