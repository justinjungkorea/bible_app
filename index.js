let url = new URL(location.href)
let params = (url.searchParams)

const resetPage = () => {
  params.set('mv', 'kjv_ko');
  params.set('sv', null);
  params.set('bk', null);
  params.set('ch', null);
  window.location.href = url;
}

if(!params.get('mv')){
  resetPage()
}

let mainVersion = params.get('mv');
let subVersion = params.get('sv');
let book = params.get('bk');
let chapter = params.get('ch');

let mainBook;
let subBook;
let numberOfChapter;
let numberOfVerse;

let otSelect = document.getElementById('otSelect');
let ntSelect = document.getElementById('ntSelect');
let chSelect = document.getElementById('chSelect');
let wordsBox = document.getElementById('wordsBox');

const getBook = (bookNumber, chapterNumber) => {
  return new Promise(resolve => {
    fetch(mainVersion + '.json')
      .then(result => {
        result.json()
          .then(async r => {
            numberOfChapter = r[bookNumber-1].book.length;
            await chapterUpdate();
            mainBook = r[bookNumber-1].book[chapterNumber-1][chapterNumber];
            numberOfVerse = Object.keys(mainBook).length;

            for(let i=1;i<=numberOfVerse;++i){
              let verseP = document.createElement('p');
              verseP.id = 'v_' + i;
              verseP.innerHTML = i + ". " + mainBook[i]
              wordsBox.appendChild(verseP)
            }

            resolve();
          })
      })
  })
}

const chapterUpdate = () => {
  return new Promise(resolve => {
    for(let i=1;i<=numberOfChapter;++i){
      let elem_option = document.createElement('option');
      elem_option.id = 'ch_'+i;
      elem_option.value = i.toString();
      elem_option.innerText = i.toString();

      if(Number(chapter) === i) elem_option.selected = true;

      chSelect.appendChild(elem_option)
    }
    resolve();
  })
}

//구약 / 신약 리스트 불러오기
fetch('book_info.json')
  .then(result => { return result.json() })
  .then(async data => {
    for(let bookName in data){
      let elem_option = document.createElement('option');
      elem_option.id = 'bk_' + bookName;
      elem_option.value = bookName;
      elem_option.innerText = data[bookName];

      //책이 선택 된 경우
      if(book === bookName) {
        elem_option.selected = true
        await getBook(book, chapter)
      }

      if(bookName < 40){
        otSelect.appendChild(elem_option)
      }
      else {
        ntSelect.appendChild(elem_option)
      }
    }
  })

//구약 선택시
otSelect.addEventListener('change', e => {
  //초기화
  if(e.target.value === 'ot') {
    resetPage();
    return;
  }

  book = e.target.value;
  let ntOption = document.getElementById('ntDefault');
  ntOption.selected = true;
  params.set('bk', book);
  params.set('ch', '1');
  window.location.href = url;
})

//신약 선택시
ntSelect.addEventListener('change', e => {
  //초기화
  if(e.target.value === 'nt') {
    resetPage();
    return;
  }

  book = e.target.value;
  let otOption = document.getElementById('otDefault');
  otOption.selected = true;
  params.set('bk', book);
  params.set('ch', '1');
  window.location.href = url;
})

chSelect.addEventListener('change', e => {
  params.set('ch', e.target.value);
  window.location.href = url;
})
