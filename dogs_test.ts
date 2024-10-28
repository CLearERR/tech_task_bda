import axios from 'axios';

let allUrls: any[] = [];
let allSubBreeds: any[] = [];

class YaUploader {
    createFolder(path: string, token: string) {
        const urlCreate = 'https://cloud-api.yandex.net/v1/disk/resources';
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `OAuth ${token}`,
        };
        axios.put(`${urlCreate}?path=${path}`, {}, { headers }).then(() => {
            console.log("Folder created");
        });
    }

    uploadPhotosToYd(token: string, path: string, urlFile: string, name: string) {
        const url = "https://cloud-api.yandex.net/v1/disk/resources/upload";
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `OAuth ${token}`,
        };
        const params = {
            path: `/${path}/${name}`,
            url: urlFile,
            overwrite: "true"
        };
        axios.post(url, {}, { headers, params }).then(() => {
            console.log(`Uploaded: ${name}`);
        });
    }
}

function fetchSubBreeds(breed: string) {
    axios.get(`https://dog.ceo/api/breed/${breed}/list`).then(res => {
        allSubBreeds = res.data.message || [];
        fetchUrls(breed);
    });
}

function fetchUrls(breed: string) {
    if (allSubBreeds.length > 0) {
        allSubBreeds.forEach(subBreed => {
            axios.get(`https://dog.ceo/api/breed/${breed}/${subBreed}/images/random`).then(res => {
                allUrls.push(res.data.message);
                axios.get(`https://dog.ceo/api/breed/${breed}/${subBreed}/images/random`).then(res => {
                    allUrls.push(res.data.message);
                });
            });
        });
    } else {
        axios.get(`https://dog.ceo/api/breed/${breed}/images/random`).then(res => {
            allUrls.push(res.data.message);
            axios.get(`https://dog.ceo/api/breed/${breed}/images/random`).then(res => {
                allUrls.push(res.data.message);
            });
        });
    }
}

function u(breed: string) {
    const yandexClient = new YaUploader();
    yandexClient.createFolder('test_folder', "AgAAAAAJtest_tokenxkUEdew");
    fetchSubBreeds(breed);
}

function t(breed: string) {
    u(breed);
    axios.get('https://cloud-api.yandex.net/v1/disk/resources?path=/test_folder').then(response => {
        const items = response.data._embedded?.items || [];
        items.forEach(item => {
            if (item.type === 'file') {
                console.log(`File found: ${item.name}`);
            }
        });
    });
}

// Random breed selection
const breeds = ['doberman', 'bulldog', 'collie'];
const randomBreed = breeds[Math.floor(Math.random() * breeds.length)];
t(randomBreed);

/*
1) Не задействован метод uploadPhotosToYd
2) Невалидный OAuth токен
3) Отсутствие await/async
4) Отсутствие обработки ошибок
5) Дублирование загрузки рандомной картинки
6) Автотест ничем не отличается от обычной функции (отсутствуют assert-ы и запуск АТ; тестовые данные не оформлены)
- для исправления можно использовать, к примеру, playwright
7) Нет проверки на существование папки перед созданием
8) Отсутствие типизации
9) URL-ы имеет смысл вынести в защищённые свойства класса и формировать ссылки из них
10) Дублирование заголовков
11) Неинформативные названия функций
 */