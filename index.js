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
let loadingBox = document.getElementById('loadingBox');
let mainPage = document.getElementById('mainPage');

let pageLoaded = false;

// book_info.json 데이터를 전역에서 공유하기 위한 객체
let bookInfoData = {};

const resetPage = () => {
  params.set('mv', 'kjv_ko'); // 기본 버전을 ko_new로 변경
  params.set('sv', 'null');
  params.set('bk', '1');
  params.set('ch', '1');
  window.location.href = url;
}

if(!params.get('mv') || !params.get('bk') || !params.get('ch')){
  resetPage()
}

let mainVersion = params.get('mv');
let subVersion = params.get('sv');
let book = params.get('bk');
let chapter = params.get('ch');

if(document.getElementById('mv_' + mainVersion)) {
  document.getElementById('mv_' + mainVersion).selected = true;
}
if(subVersion !== 'null' && document.getElementById('sv_' + subVersion)){
  document.getElementById('sv_' + subVersion).selected = true;
}

let mainBook;
let subBook;
let numberOfChapter;
let numberOfVerse;
let bookName;
let bookNameArray = [];

let lsId = ('00' + book).slice(-2)+('000' + chapter).slice(-3);
let isSaved = !!localStorage.getItem(lsId);
let verseMemo = isSaved ? JSON.parse(localStorage.getItem(lsId)) : {};
let verseCopy = {};

//구절 선택 이벤트
const selectVerse = async id => {
  let selectedVerse = document.getElementById(id);
  if (selectedVerse.style.color === "black") {
    selectedVerse.style.color = "#003399";
    selectedVerse.style.fontWeight = '500';
    verseMemo[id] = true;
    verseCopy[id] = true;
  } else {
    selectedVerse.style.color = "black";
    selectedVerse.style.fontWeight = '400';
    selectedVerse.style.backgroundColor = 'transparent';
    delete verseMemo[id];
    delete verseCopy[id];
  }

  localStorage.setItem(lsId, JSON.stringify(verseMemo));

  let str = '';
  for(let i=1;i<=numberOfVerse;++i){
    if(verseCopy[i]){
      str = str + i + ". " + mainBook[i] + '\n';
    }
  }

  str = str + bookName + ' ' + chapter + '장';
  await navigator.clipboard.writeText(str);
}

const getBook = (bookNumber, chapterNumber) => {
  return new Promise(resolve => {
    // bible/[버전명]/[책번호].json 형태로 비동기 호출
    fetch(`bible/${mainVersion}/${bookNumber}.json`)
      .then(result => {
        result.json()
          .then(async r => {
            // 외부 book_info.json에서 매핑된 책 이름을 할당
            bookName = bookInfoData[bookNumber];
            // 해당 책의 JSON 오브젝트가 가진 최상위 키 개수가 총 장 수가 됨
            numberOfChapter = Object.keys(r).length;
            
            await chapterUpdate();
            
            // 데이터 포맷 변화에 따라 해당 장 객체를 바로 참조
            mainBook = r[chapterNumber];
            numberOfVerse = Object.keys(mainBook).length;

            // 새로운 장 로드 시 기존 화면 초기화
            wordsBox.innerHTML = '';

            //대역이 없는 경우
            if(subVersion === 'null' || !subVersion) {
              for(let i=1;i<=numberOfVerse;++i){
                let verseP = document.createElement('p');
                let verseSpan = document.createElement('span');
                verseSpan.id = i;

                if(verseMemo[verseSpan.id]){
                  verseSpan.style.backgroundColor = '#FAFAD2'
                  verseSpan.style.color = 'black';
                }
                else {
                  verseSpan.style.color = 'black';
                  verseSpan.style.fontWeight = '400';
                }

                verseSpan.innerHTML = i + ". " + mainBook[i]
                verseP.appendChild(verseSpan)
                wordsBox.appendChild(verseP)

                verseSpan.onclick = async e => {
                  await selectVerse(e.target.id);
                }
              }
            }
            //대역이 있는 경우
            else {
              fetch(`bible/${subVersion}/${bookNumber}.json`)
                .then(result => {
                  result.json()
                    .then(async rSub => {
                      subBook = rSub[chapterNumber];

                      for(let i=1;i<=numberOfVerse;++i){
                        let verseP = document.createElement('p');
                        let verseSpan = document.createElement('span');
                        verseSpan.id = i;

                        if(verseMemo[verseSpan.id]){
                          verseSpan.style.backgroundColor = '#FAFAD2'
                          verseSpan.style.color = 'black';
                        }
                        else {
                          verseSpan.style.color = 'black';
                          verseSpan.style.fontWeight = '400';
                        }

                        verseSpan.innerHTML = i + '. ' + mainBook[i] + '<br/>' + i + '. ' + subBook[i] + '<br/><br/>'
                        verseP.appendChild(verseSpan);
                        wordsBox.appendChild(verseP)

                        verseSpan.onclick = async e => {
                          await selectVerse(e.target.id);
                        }
                      }
                    })
                })
            }
            chSelect.hidden = false;
            chapterLabel.hidden = false;
            chapterLabel.innerText = bookNumber === '19' ? '편':'장'

            if(Number(chapter) > 1) preChapterBtn.hidden = false;
            else preChapterBtn.hidden = true;
            
            if(numberOfChapter !== Number(chapter)) nextChapterBtn.hidden = false;
            else nextChapterBtn.hidden = true;
            
            pageLoaded = true;
            resolve();
          })
      })
  })
}

const chapterUpdate = () => {
  return new Promise(resolve => {
    chSelect.innerHTML = ''; // 장 변경 시 기존 option 태그 누적 현상 방지
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
    bookInfoData = data; // 로드한 매핑용 json 데이터를 전역 객체에 할당
    loadingBox.style.display = 'block'
    mainPage.style.display = 'none'
    for(let bookKey in data){
      let elem_option = document.createElement('option');
      elem_option.id = 'bk_' + bookKey;
      elem_option.value = bookKey;
      elem_option.innerText = data[bookKey];
      bookNameArray.push(data[bookKey]);

      //책이 선택 된 경우
      if(book === bookKey) {
        elem_option.selected = true
        await getBook(book, chapter)
      }

      bookSelect.appendChild(elem_option)
    }
    loadingBox.style.display = 'none'
    mainPage.style.display = 'block'
    console.log('[after load before focus]', {
      activeElement: document.activeElement,
      activeTag: document.activeElement?.tagName,
      activeId: document.activeElement?.id
    })
    document.body.focus({ preventScroll: true })
    console.log('[after body focus]', {
      activeElement: document.activeElement,
      activeTag: document.activeElement?.tagName,
      activeId: document.activeElement?.id
    })
  })

//키보드 이벤트
document.addEventListener('keydown', e => {
  console.log('[keydown]', {
    key: e.key,
    code: e.code,
    shiftKey: e.shiftKey,
    activeElement: document.activeElement,
    activeTag: document.activeElement?.tagName,
    activeId: document.activeElement?.id,
    target: e.target,
    targetTag: e.target?.tagName,
    targetId: e.target?.id
  });
  const keyName = e.key;
  const isShiftPressed = e.shiftKey;

  if(keyName === 'ArrowLeft' && !isShiftPressed){
    if(Number(chapter)<=1 || !pageLoaded)  return;
    e.preventDefault();
    params.set('ch', (Number(chapter)-1).toString());
    window.location.href = url;
  }
  else if(keyName === 'ArrowRight' && !isShiftPressed){
    if(numberOfChapter <= Number(chapter) || !pageLoaded) return;
    e.preventDefault();
    params.set('ch', (Number(chapter)+1).toString());
    window.location.href = url;
  }
  else if(keyName === 'ArrowLeft' && isShiftPressed){
    if(book == 1 || !pageLoaded) return;
    e.preventDefault();
    params.set('bk', (Number(book)-1).toString());
    params.set('ch', '1');
    window.location.href = url;
  }
  else if(keyName === 'ArrowRight' && isShiftPressed){
    if(book == 66 || !pageLoaded) return;
    e.preventDefault();
    params.set('bk', (Number(book)+1).toString());
    params.set('ch', '1');
    window.location.href = url;
  }
  else if((keyName === 'o' || keyName === 'O' || keyName === 'ㅐ' || keyName === 'ㅒ') && isShiftPressed){
    e.preventDefault();
    params.set('bk', 1);
    params.set('ch', '1');
    window.location.href = url;
  }
  else if((keyName === 'n' || keyName === 'N' || keyName === 'ㅜ') && isShiftPressed){
    e.preventDefault();
    params.set('bk', 40);
    params.set('ch', '1');
    window.location.href = url;
  }
  else if((keyName === 'g' || keyName === 'G' || keyName === 'ㅎ') && isShiftPressed){
    e.preventDefault();
    let request = prompt("입력한 장으로 이동");
    if(request === null || isNaN(request) || Number(request)<1 || Number(request)>numberOfChapter)  return;
    params.set('ch', request);
    window.location.href = url;
  }
  else if((keyName === 'b' || keyName === 'B' || keyName === 'ㅠ') && isShiftPressed){
    e.preventDefault();
    let request = prompt("입력한 책으로 이동");
    if(!request) return;
    let similarBooks = bookNameArray.filter(item => item.includes(request));
    if(similarBooks.length === 0)   return;
    let idx = bookNameArray.indexOf(similarBooks[0]);
    if(idx < 0) return;
    params.set('bk', idx+1);
    params.set('ch', 1);
    window.location.href = url;
  }
})

bookSelect.addEventListener('change', e => {
  if(e.target.value === 'book') {
    resetPage();
    return;
  }
  book = e.target.value;
  params.set('bk', book);
  params.set('ch', '1');
  window.location.href = url;
})

chSelect.addEventListener('change', e => {
  params.set('ch', e.target.value);
  window.location.href = url;
})

mvSelect.addEventListener('change', e => {
  params.set('mv', e.target.value);
  window.location.href = url;
})

svSelect.addEventListener('change', e => {
  params.set('sv', e.target.value);
  window.location.href = url;
})

preChapterBtn.addEventListener('click', () => {
  params.set('ch', (Number(chapter)-1).toString());
  window.location.href = url;
})

nextChapterBtn.addEventListener('click', () => {
  params.set('ch', (Number(chapter)+1).toString());
  window.location.href = url;
})

history.scrollRestoration = "auto";
