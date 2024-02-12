const config = {
   content: ['./src/**/*.{html,js,svelte,ts}'],

   theme: {},

   plugins: [require('daisyui')],

   daisyui: {
      themes: [
         {
            dracula: {
               ...require('daisyui/src/colors/themes')['[data-theme=dracula]'],
               primary: '#ff99d3',
               'primary-focus': '#e28399',
               'secondary-focus': '#a76ef7',
               neutral: '#313444',
               'neutral-focus': '#3c3f53',
               '--tw-text-opacity': '0.85'
            }
         },

         {
            mars: {
               primary: '#d57676',
               'primary-focus': '#cd5c5c',
               secondary: '#6dbbc4',
               accent: '#a08bda',
               neutral: '#332834',
               'base-100': 'rgb(41, 32, 42)',

               // 'base-100': '#413441',
               info: '#818cf8',
               success: '#38E595',
               warning: '#F7A14B',
               error: '#be123c'
            }
         }
      ]
   }
}

module.exports = config
