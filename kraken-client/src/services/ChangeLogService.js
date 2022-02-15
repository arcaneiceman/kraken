import axios from 'axios'

const getLatestChangeLog = async () => {
    const readme = await axios.get('')
    const segments = readme.data.split("####");
    segments.shift(); // Remove First Item
    return segments[0]
}

const ReadmeFileService = {
    getLatestChangeLog
}

export default ReadmeFileService;