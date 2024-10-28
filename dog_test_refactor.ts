import axios from 'axios';

type TFetchSubBreedListResponse = {
    data: {
        message: string[];
        status: string;
    }
}

type TFetchImageResponse = {
    data: {
        message: string;
        status: string;
    }
}


class YaUploader {
    _putMethodUrl = 'https://cloud-api.yandex.net/v1/disk/resources';
    _postMethodUrl = `https://cloud-api.yandex.net/v1/disk/resources/resources/upload`;
    _headers = {};
    _folders = new Set();

    constructor(token) {
        this._headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `OAuth ${token}`,
        };
    }

    async createFolder(path: string) {
        try {
            if (this._folders.has(path)) throw new Error('Folder already exists');

            await axios.put(`${this._putMethodUrl}?path=${path}`, {}, { headers: this._headers });
            this._folders.add(path);
            console.log("Folder created");
        } catch (error) {
            console.error("Error creating folder:", error);
        }
    }

    async uploadPhotosToYd(folderPath: string, urlFile: string, name: string) {
        try {
            if (!this._folders.has(folderPath)) throw new Error('Folder doesn`t exist');

            const params = {
                path: `/${folderPath}/${name}`,
                url: urlFile,
                overwrite: true
            };

            await axios.post(this._postMethodUrl, {}, { headers: this._headers, params });
            console.log(`Uploaded: ${name}`);
        } catch (error) {
            console.error("Error uploading photo:", error);
        }
    }
}

async function fetchSubBreedList(breed: string): Promise<string[]> {
    let subBreedList: string[] = [];
    try {
        const res: TFetchSubBreedListResponse = await axios.get(`https://dog.ceo/api/breed/${breed}/list`);
        subBreedList = res.data.message || [];
    } catch (error) {
        console.error("Error fetching sub breeds:", error);

    } finally {
        return subBreedList;
    }
}

async function fetchImage(breed: string, subBreed?: string): Promise<string | undefined> {
    let imageUrl: string | undefined = undefined;

    const url = subBreed ?
        `https://dog.ceo/api/breed/${breed}/${subBreed}/images/random` :
        `https://dog.ceo/api/breed/${breed}/images/random`;

    try {
        const response: TFetchImageResponse = await axios.get(url);
        imageUrl = response.data.message;
    } catch (error) {
        console.error("Error fetching image:", error);
    } finally {
        return imageUrl;
    }
}

const addImageUrl = (image: string | undefined, urlList: string[]) => {
    if (image) {
        urlList.push(image);
    }
}

async function fetchImageUrlList(breed: string) {
    const imageUrlList: string[] = [];
    const subBreedList = await fetchSubBreedList(breed);

    if (subBreedList.length) {
        await Promise.all(subBreedList.map(async (subBreed) => {
            const image = await fetchImage(breed, subBreed);
            addImageUrl(image, imageUrlList);
        }));
    }
    else {
        const image = await fetchImage(breed);
        addImageUrl(image, imageUrlList);
    }

    return imageUrlList;
}

async function uploadPhotos(breed: string, uploader: YaUploader, folderName: string) {
    const imageUrlList = await fetchImageUrlList(breed);

    await Promise.all(imageUrlList.map(async (url, idx) => {
        await uploader.uploadPhotosToYd(folderName, url, `photo${idx + 1}.jpg`);
    }));
}

async function uploadToYDTest(breed: string) {
    const folderName = 'test_folder';
    const yandexClient = new YaUploader("AgAAAAAJtest_tokenxkUEdew");
    await yandexClient.createFolder(folderName);
    await uploadPhotos(breed, yandexClient, folderName);
}

// Random breed selection
const breeds = ['doberman', 'bulldog', 'collie'];
const randomBreed = breeds[Math.floor(Math.random() * breeds.length)];
uploadToYDTest(randomBreed);
