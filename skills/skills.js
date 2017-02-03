const path = require('path');
const fs = require('fs');
const express = require('express');

const getDirectories = srcpath =>
    fs.readdirSync(srcpath).filter(file =>
        fs.statSync(path.join(srcpath, file)).isDirectory());

const skills = [];

function * loadSkills(skillsApi) {
    skillsApi.get('/', function(req, res) {
        const skillIntents = [];
        skills.map(skill => {
            skillIntents.push(skill.intent());
        });
        res.json(skillIntents);
    });

    const skills_dir = __dirname.replace('/api', '');
    const dirs = getDirectories(skills_dir);

    dirs.map(dir => {
        const skill = require(`./${dir}`);
        skills.push(skill);

        if (typeof(skill.register) == 'function') {
            const localSkillApi = express();
            skillsApi.use('/' + skill.intent().module, localSkillApi);
            skill.register(localSkillApi);
        }
    });
}

function getSkills() {
    return skills;
}

module.exports = {
    loadSkills,
    getSkills
};
