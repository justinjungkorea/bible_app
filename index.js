let url = new URL(location.href)
let params = (url.searchParams)

let bookSelect = document.getElementById('bookSelect');
let chSelect = document.getElementById('chSelect');
let mvSelect = document.getElementById('mainVersion');
let svSelect = document.getElementById('subVersion');
let wordsBox = document.getElementById('wordsBox');
let preChapterBtn = document.getElementById('preChapterBtn');
let nextChapterBtn = document.getElementById('nextChapterBtn');
let chapterLabel = document.getElementById('chapterLabel');
// let copyAll = document.getElementById('copyAll');
let loadingBox = document.getElementById('loadingBox');

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

document.getElementById('mv_' + mainVersion).selected = true;
if(subVersion !== 'null'){
  document.getElementById('sv_' + subVersion).selected = true;
}

let mainBook;
let subBook;
let numberOfChapter;
let numberOfVerse;
let bookName;

let lsId = ('00' + book).slice(-2)+('000' + chapter).slice(-3);
let isSaved = !!localStorage.getItem(lsId);
let verseMemo = isSaved ? JSON.parse(localStorage.getItem(lsId)) : {};

//구절 선택 이벤트
const selectVerse = async id => {
  //선택된 구절 스타일 변경
  let selectedVerse = document.getElementById(id);
  if (selectedVerse.style.color === "black") {
    selectedVerse.style.color = "#003399";
    selectedVerse.style.fontWeight = '500';
    verseMemo[id] = true;
  } else {
    selectedVerse.style.color = "black";
    selectedVerse.style.fontWeight = '400';
    delete verseMemo[id];
  }

  localStorage.setItem(lsId, JSON.stringify(verseMemo));

  //선택된 구절 클립보드에 복사
  let str = '';
  for(let i=1;i<=numberOfVerse;++i){
    if(verseMemo[i]){
      str = str + i + ". " + mainBook[i] + '\n';
    }
  }

  str = str + bookName + ' ' + chapter + '장';
  await navigator.clipboard.writeText(str);

}

const getBook = (bookNumber, chapterNumber) => {
  return new Promise(resolve => {
    fetch(mainVersion + '.json')
      .then(result => {
        result.json()
          .then(async r => {
            loadingBox.hidden = false
            bookName = r[bookNumber-1].book_name;
            numberOfChapter = r[bookNumber-1].book.length;
            await chapterUpdate();
            mainBook = JSON.parse(JSON.stringify(r[bookNumber-1].book[chapterNumber-1][chapterNumber]));
            numberOfVerse = Object.keys(mainBook).length;

            //대역이 없는 경우
            if(subVersion === 'null') {
              for(let i=1;i<=numberOfVerse;++i){
                let verseP = document.createElement('p');
                verseP.id = i;

                //메모가 된 경우 반영
                if(verseMemo[verseP.id]){
                  verseP.style.color = '#003399';
                  verseP.style.fontWeight = '500';
                }
                else {
                  verseP.style.color = 'black';
                  verseP.style.fontWeight = '400';
                }

                verseP.innerHTML = i + ". " + mainBook[i]
                wordsBox.appendChild(verseP)

                verseP.onclick = async e => {
                  await selectVerse(e.target.id);
                }
              }
            }
            //대역이 있는 경우
            else {
              fetch(subVersion + '.json')
                .then(result => {
                  result.json()
                    .then(async r => {
                      subBook = JSON.parse(JSON.stringify(r[bookNumber - 1].book[chapterNumber - 1][chapterNumber]));

                      for(let i=1;i<=numberOfVerse;++i){
                        let verseP = document.createElement('p');
                        verseP.id = i;

                        //메모가 된 경우 반영
                        if(verseMemo[verseP.id]){
                          verseP.style.color = '#003399';
                          verseP.style.fontWeight = '500';
                        }
                        else {
                          verseP.style.color = 'black';
                          verseP.style.fontWeight = '400';
                        }

                        verseP.innerHTML = i + '. ' + mainBook[i] + '<br/>' + i + '. ' + subBook[i] + '<br/><br/>'
                        wordsBox.appendChild(verseP)

                        verseP.onclick = async e => {
                          await selectVerse(e.target.id);
                        }
                      }

                    })
                })
            }
            chSelect.hidden = false;
            chapterLabel.hidden = false;
            // copyAll.hidden = false;

            if(Number(chapter) > 1) preChapterBtn.hidden = false;
            if(numberOfChapter !== Number(chapter)) nextChapterBtn.hidden = false;

            loadingBox.hidden = true
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

      bookSelect.appendChild(elem_option)
    }
  })

//책 선택
bookSelect.addEventListener('change', e => {
  //초기화
  if(e.target.value === 'ot') {
    resetPage();
    return;
  }

  book = e.target.value;
  params.set('bk', book);
  params.set('ch', '1');
  window.location.href = url;
})

//장 선택시
chSelect.addEventListener('change', e => {
  params.set('ch', e.target.value);
  window.location.href = url;
})

//번역 선택 시
mvSelect.addEventListener('change', e => {
  params.set('mv', e.target.value);
  window.location.href = url;
})

//대역 선택 시
svSelect.addEventListener('change', e => {
  params.set('sv', e.target.value);
  window.location.href = url;
})

//이전 장으로 이동
preChapterBtn.addEventListener('click', () => {
  params.set('ch', (Number(chapter)-1).toString());
  window.location.href = url;
})

//다음 장으로 이동
nextChapterBtn.addEventListener('click', () => {
  params.set('ch', (Number(chapter)+1).toString());
  window.location.href = url;
})

// //전체 복사
// copyAll.addEventListener('click', async () => {
//   let str = bookName + ' ' + chapter + '장' + '\n';
//   for(let i=1;i<=numberOfVerse;++i){
//     str = str + i + ". " + mainBook[i] + '\n';
//   }
//   await navigator.clipboard.writeText(str);
//   alert('done')
// })
