const path = require('path');
const fs = require('fs');

const getDirectories = srcpath =>
    fs.readdirSync(srcpath).filter(file => fs.statSync(path.join(srcpath, file)).isDirectory());

const skills = [];

async function loadSkills() {
    const skills_dir = __dirname.replace('/api', '');
    const dirs = getDirectories(skills_dir);

    for (let i = 0; i < dirs.length; i++) {
        const dir = dirs[i];
        const skill = require(`./${dir}`);
        skill.name = dir;
        skills.push(skill);

        if (skill.setup) {
            await Promise.resolve(skill.setup());
        }
    }
}

async function registerClient(socket, user) {
    for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        if (typeof skill.registerClient === 'function') {
            await skill.registerClient(socket, user);
        }
    }
}

function getSkills() {
    return skills;
}

module.exports = {
    loadSkills,
    getSkills,
    registerClient,
};
