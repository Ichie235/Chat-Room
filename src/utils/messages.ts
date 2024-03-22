import moment from 'moment';

function formatMessages(username: string, text: string) {
    return {
        username: username,
        text: text,
        time: moment().format('h:mm a'),
    };
}

export default formatMessages;
