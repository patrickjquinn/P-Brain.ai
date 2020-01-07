function hardRule(query) {
    return (
        query.startsWith('my name') ||
        query.startsWith('im called') ||
        query.startsWith('whats my name') ||
        query.startsWith('who am i')
    );
}

async function name_resp(query, breakdown, user) {
    if (query.startsWith('my name') || query.startsWith('im called')) {
        const words = query.toLowerCase().split(' ');

        let nameIndex = words.length - 1;
        if (words.indexOf('me') >= 0) {
            nameIndex = words.indexOf('me') + 1;
        } else if (words.indexOf('called') >= 0) {
            nameIndex = words.indexOf('called') + 1;
        } else if (words.indexOf('name is') >= 0) {
            nameIndex = words.indexOf('is') + 1;
        }
        const names = words.splice(nameIndex, words.length - nameIndex);
        if (names.length == 0) {
            return { text: "I'm sorry, I did't quite catch your name..." };
        }

        let name = '';
        // Make the first letters uppercase and make it into one string.
        for (let i = 0; i < names.length; i++) {
            name += `${names[i].charAt(0).toUpperCase() + names[i].slice(1)}`;
        }
        if (name.length <= 0) {
            return {
                text: "I'm sorry, I did't quite catch your name...",
            };
        }
        await global.db.setValue('personal_details', user, 'name', name);
        return { text: `Okay I'll call you ${name}.`, name };
    } else {
        const name = await global.db.getValue('personal_details', user, 'name');
        return { text: `Your name is ${name}.`, name };
    }
}

const examples = () => ['My name is Patrick', 'My name is Marco'];

module.exports = {
    get: name_resp,
    hardRule,
    examples,
};
