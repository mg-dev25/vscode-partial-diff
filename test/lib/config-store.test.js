const { when, mockObject } = require('../helpers')
const assert = require('assert')

const ConfigStore = require('../../lib/config-store')

suite('ConfigStore', () => {
  test('it reads text normalisation rules from vscode.workspace', () => {
    const extensionConfig = mockObject('get')
    when(extensionConfig.get('preComparisonTextNormalizationRules')).thenReturn(
      'RULES'
    )

    const workspace = mockObject('getConfiguration')
    when(workspace.getConfiguration('partialDiff')).thenReturn(extensionConfig)

    const configStore = new ConfigStore({ workspace })
    assert.deepEqual(configStore.preComparisonTextNormalizationRules, 'RULES')
  })
})
