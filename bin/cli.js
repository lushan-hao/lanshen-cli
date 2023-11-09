#! /usr/bin/env node

const { program } = require('commander');
const package = require('../package.json');
const inquirer = require('inquirer');
// const templates = require('./templates.js');
const downloadGitRepo = require('download-git-repo');
const path = require('path');
const ora = require('ora'); // 引入ora
const fs = require('fs-extra'); // 引入fs-extra
const { getGitReposList } = require('./api.js');

program.version(`v${package.version}`);
program.on('--help', () => { });
const loading = ora('正在下载模版...');

program
	.command('create [projectName]')
	.description('创建模版')
	.option('-t, --template <template>', '模版名称')
	.action(async (projectName, options) => {
		// 1. 从模版列表中找到对应的模版
		const getRepoLoading = ora('获取模版列表...');
		getRepoLoading.start();
		const templates = await getGitReposList('lushan-hao');
		console.log('templates :>> ', templates);
		getRepoLoading.succeed('获取模版列表成功!');

		let project = templates.find(
			(template) => template.name === options.template
		);
		// 2. 如果匹配到模版就赋值，没有匹配到就是undefined
		let projectTemplate = project ? project.value : undefined;
		console.log('命令行参数：', projectName, projectTemplate);

		if (!projectName) {
			const { name } = await inquirer.prompt({
				type: 'input',
				name: 'name',
				message: '请输入项目名称：',
			});
			projectName = name; // 赋值输入的项目名称
		}
		console.log('项目名称：', projectName);

		const dest = path.join(process.cwd(), projectName);
		if (fs.existsSync(dest)) {
			const { force } = await inquirer.prompt({
				type: 'confirm',
				name: 'force',
				message: '目录已存在，是否覆盖？',
			});
			// 如果覆盖就删除文件夹继续往下执行，否的话就退出进程
			force ? fs.removeSync(dest) : process.exit(1);
		}

		if (!projectTemplate) {
			const { template } = await inquirer.prompt({
				type: 'list',
				name: 'template',
				message: '请选择模版：',
				choices: templates, // 模版列表
			});
			projectTemplate = template; // 赋值选择的项目名称
		}
		console.log('模版：', projectTemplate);

		loading.start();
		downloadGitRepo(projectTemplate, dest, (err) => {
			if (err) {
				loading.fail('创建模版失败：' + err.message); // 失败loading
			} else {
				loading.succeed('创建模版成功!'); // 成功loading
				// 添加引导信息(每个模版可能都不一样，要按照模版具体情况来)
				console.log(`\ncd ${projectName}`);
				console.log('npm i');
				console.log('npm start\n');
			}
		});
	});

program.parse(process.argv);
