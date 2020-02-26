/* eslint-disable no-restricted-globals */

self.onmessage = async (message) => {
    console.debug("Encoder received job")
    const fileReader = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsBinaryString(file);
        })
    }
    let valueToMatch = message.data.type === "file" ? await fileReader(message.data.valueToMatch) : message.data.valueToMatch;
    self.postMessage({ valueToMatchInBase64: btoa(valueToMatch) })
    console.debug("Finishing Up")
};

