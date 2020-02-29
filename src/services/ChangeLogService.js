import axios from 'axios'

const getLatestChangeLog = async () => {
    const readme = await axios.get('https://raw.githubusercontent.com/arcaneiceman/kraken-client/master/README.md')
    const segments = readme.data.split("####");
    segments.shift(); // Remove First Item
    return segments[0]
}

const ReadmeFileService = {
    getLatestChangeLog
}

export default ReadmeFileService;