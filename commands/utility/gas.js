const { getGas } = require('../../contract-functions/utils')
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gas')
		.setDescription('Replies with AVAX gas GWEI amount'),
	async execute(interaction) {
        var gas = await getGas()
		await interaction.reply('🔺 ' + gas + ' gwei 🔺');
	},
};