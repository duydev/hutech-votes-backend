const _ = require('lodash');
const axios = require('axios').default;
const cheerio = require('cheerio');
const FormData = require('form-data');

async function getCategoriesAndCandidates() {
  const response = await axios({
    url: `https://www.hutech.edu.vn/hutechface/binh-chon`,
    method: 'GET',
    responseType: 'document',
    timeout: 1000,
    headers: {
      'User-Agent': `Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36`
    }
  });

  const $ = cheerio.load(response.data);

  const htmlCats = $('section.zma-vertical-scrolling').toArray();

  const docs = htmlCats.reduce(
    (obj, elm, index) => {
      const categoryId = index + 1;
      const categoryName = $('.zma-sub-titlee.text-center', elm).text().trim();

      obj.categories.push({
        id: categoryId,
        name: categoryName
      });

      const htmlCandidates = $('.zma-card-info.zma-type-artist', elm).toArray();

      let candidates = htmlCandidates.map((elm) => {
        const id = Number.parseInt($(elm).attr('arrid'), 10);
        const image = $('img', elm).attr('src').trim();
        const name = $('.zma-name.text-center', elm).text().trim();
        const title = $('.artist.text-center', elm).text().trim();

        return {
          id,
          categoryId,
          image,
          name,
          title,
          description: '',
          votes: 0
        };
      });

      candidates = _.uniqBy(candidates, 'id');

      obj.candidates.push(...candidates);

      return obj;
    },
    {
      categories: [],
      candidates: []
    }
  );

  return docs;
}

async function getCandidateById(id) {
  const response = await axios({
    url: `https://www.hutech.edu.vn/hutechface/thisinh/getone/${id}`,
    method: 'GET',
    responseType: 'document',
    timeout: 1000,
    headers: {
      'User-Agent': `Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36`
    }
  });

  const $ = cheerio.load(response.data, { decodeEntities: false });

  const image = $('.img-responsive').attr('src').trim();
  const name = $('.title-block.text-blue.nopadding').text().trim();
  const title = $('.news-info b').text().replace('Link bình chọn:', '').trim();

  let votes = $(`div[style="color: #999"]`).text().trim().split(' ');
  // let votes = $('dd.create span').text().trim().split(' ');
  votes = Number.parseInt(votes[0], 10);

  const description = $('#contentnews').html().trim();

  return {
    id,
    image,
    name,
    title,
    votes,
    description
  };
}

async function getCandidateVotesById(candidateId) {
  try {
    const boring = await axios.get(
      `https://www.hutech.edu.vn/hutechface/thisinh/getone/${candidateId}`,
      {
        responseType: 'document',
        timeout: 3000,
        headers: {
          'Cache-Control': 'no-cache',
          'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1`
        }
      }
    );

    const happy = boring.headers['set-cookie']
      .join('')
      .trim()
      .split('ci_session=')[1]
      .split(';')[0];

    const sad = await axios.get(
      `https://www.hutech.edu.vn/hutechface/luot-binh-chon`,
      {
        responseType: 'arraybuffer',
        headers: {
          Cookie: `ci_session=${happy};`
        }
      }
    );

    const huhu =
      `data:image/png;base64,` +
      Buffer.from(sad.data, 'binary').toString('base64');

    const hehe = await bakeCake(huhu);

    if (hehe && !Number.isNaN(hehe)) {
      return hehe;
    }

    const requests = Array(5)
      .fill()
      .map(() =>
        axios.get(
          `https://www.hutech.edu.vn/hutechface/thisinh/getone/${candidateId}`,
          {
            responseType: 'document',
            timeout: 3000,
            headers: {
              'Cache-Control': 'no-cache',
              'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1`
            }
          }
        )
      );

    responses = await axios.all(requests);

    responses = responses.map((response) => {
      if (response.status === 200) {
        const $ = cheerio.load(response.data);

        const rawVotes = (response.data || '').split(' ').reduce((arr, elm) => {
          let tmp = Number.parseInt(elm.trim(), 10);

          if (tmp && !Number.isNaN(tmp)) {
            arr.push(tmp);
          }

          return arr;
        }, []);

        return rawVotes;
      } else {
        [0, 0];
      }
    });

    const [votes] = _.intersection(...responses);

    return votes;
  } catch (err) {
    console.error(err);

    return 0;
  }
}

async function vote(candidateId, fbId) {
  const response = await axios({
    url: `https://bctc.vn/hutechface/binhchon.php?id=${fbId}`,
    method: 'GET',
    headers: {
      'User-Agent': `Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36`,
      Cookie: `thisinhid=${candidateId}; idfacebook=${fbId}; hutech094qqwe=AQBiH_C1GW8MFh24M6idjOSx69d3PoBHvKIwjOubJNlKpErnu-d289RoXl6ApBArn-qRwuNIAawp1PTu10Beo_NyayWmnBFA7f5Vc4ueP8ZurGbZfZUPgmgQ3D0KnSZeQOmXq8kyRjB3pW3iVs7UxP4P_uZqoyEpv977SXp3et-a8eHNCxpVQpMpk4srqlQeiCUFuN7kfrSlB5mGbnMp-a4ra0SCZKMIsdpQWzULnTkkNZt17x2UQgcjxloYNKuJamM7savsKv3nnfW8AFozYIfT8VRUfWT56JidO2IUeRYkjyOsWZj911fLBhW_d9wiMrL6cNSXHbZujQqn2rdfRBkPQybbA5aXuxPQ9ONAIGDiKrDIox4a4rLAhmzc-WsyZxA1586791828977513322552657`
    },
    responseType: 'text',
    timeout: 5000
  });

  return response.data === `Cảm ơn bạn đã bình chọn`;
}

function generateId(length = 15) {
  const chars = '0123456789';

  return Array(length)
    .fill()
    .map((elm, index) => {
      if (!index) return _.sample(chars.slice(1));

      return _.sample(chars.slice(0));
    })
    .join('');
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getAllCandidatesVotes() {
  try {
    const { data } = await axios.get(
      `https://www.hutech.edu.vn/hutechface/binh-chon`,
      {
        responseType: 'document',
        timeout: 3000,
        headers: {
          'Cache-Control': 'no-cache',
          'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1`
        }
      }
    );

    const $ = cheerio.load(data);

    let allVotes = $('.zma-type-artist')
      .toArray()
      .reduce((obj, elm) => {
        const id = Number.parseInt($(elm).attr('arrid'), 10);

        if (!id || Number.isNaN(id) || !!obj[id]) return obj;

        const votes = $(elm)
          .text()
          .split(' ')
          .reduce((arr, elm) => {
            let tmp = Number.parseInt(elm.trim(), 10);

            if (tmp && !Number.isNaN(tmp)) {
              arr.push(tmp);
            }

            return arr;
          }, []);

        obj[id] = votes[0];

        return obj;
      }, {});

    return allVotes;
  } catch (err) {
    console.error(err);

    return {};
  }
}

async function bakeCake(receipt) {
  try {
    const formData = new FormData();
    formData.append('apikey', process.env.CAKE);
    formData.append('filetype', 'png');
    formData.append('scale', 'true');
    formData.append('OCREngine', 2);
    formData.append('base64Image', receipt);

    const { data } = await axios.post(
      `https://api.ocr.space/parse/image`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    let result = data.ParsedResults[0].ParsedText.trim();

    result = result.split('U').join('1');

    result = Number.parseInt(result, 10);

    return Number.isNaN(result) ? 0 : result;
  } catch (err) {
    return 0;
  }
}

module.exports = {
  getCategoriesAndCandidates,
  getCandidateById,
  vote,
  generateId,
  getCandidateVotesById,
  sleep,
  getAllCandidatesVotes
};
