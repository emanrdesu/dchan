const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {}
	},

	plugins: [
		require("daisyui")
	],

	daisyui: {
		prefix: "ds",
		themes: ["dracula", "autumn"],
	}
};

module.exports = config;
