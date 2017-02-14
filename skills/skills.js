const path = require('path')
const fs = require('fs')
const express = require('express')
const co = require('co')

const getDirectories = srcpath =>
    fs.readdirSync(srcpath).filter(file =>
        fs.statSync(path.join(srcpath, file)).isDirectory())

const skills = []

function * loadSkills(skillsApi, io) {
    skillsApi.get('/', (req, res) => {
        const skillNames = []
        skills.map(skill => {
            if (skill.intent) {
                skillNames.push(skill.name)
            }
        })
        res.json(skillNames)
    })

    const skills_dir = __dirname.replace('/api', '')
    const dirs = getDirectories(skills_dir)

    for (let i = 0; i < dirs.length; i++) {
        const dir = dirs[i]
        const skill = require(`./${dir}`)
        skill.name = dir
        skills.push(skill)

        if (typeof (skill.register) === 'function') {
            const localSkillApi = express()
            skillsApi.use('/' + skill.name, localSkillApi)
            yield skill.register(localSkillApi, io)
        }
    }
}

function * registerClient(socket, user) {
    for (let i = 0; i < skills.length; i++) {
        const skill = skills[i]
        if (typeof (skill.registerClient) === 'function') {
            yield skill.registerClient(socket, user)
        }
    }
}

function getSkills() {
    return skills
}

module.exports = {
    loadSkills,
    getSkills,
    registerClient
}
