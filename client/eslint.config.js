import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  // add more generic rulesets here, such as:
  // js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  // ...pluginVue.configs['flat/vue2-recommended'], // Use this if you are using Vue.js 2.x.
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
    },
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    }
  }
]