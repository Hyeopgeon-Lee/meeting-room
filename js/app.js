import * as api from './api.js?v=20260921-3';

const rooms = ['8318', '8319'];

const purposes = [
  '학과 회의',
  '수업/세미나',
  '학생 모임',
  '상담/면담',
  '프로젝트',
  '면접',
  '기타'
];

const purposeLabels = {'학과 회의':'학과 행사 준비','수업/세미나':'수업 · 교육 · 세미나','학생 모임':'스터디 · 학습','상담/면담':'학생 상담 · 면담','프로젝트':'프로젝트 · 팀 회의','면접':'발표 · 면접 연습','기타':'기타 학과 업무'};
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ({room:'<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16m-11 4h2m3 0h2m-7 3h2"/>',book:'<path d="M12 5v14M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="4"/>',mine:'<circle cx="12" cy="8" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>'}[name] || '') + '</svg>';
const notice = () => '<aside class="notice">' + icon('info') + '<div><strong>이용 안내</strong><p>학과 학생만 이용할 수 있습니다.<br>식사 및 음료 섭취 목적의 예약은 할 수 없습니다.</p></div></aside>';
const stateCard = (title, text, kind='empty') => '<div class="state-card '+kind+'" role="status">'+(kind==='loading'?'<span class="spinner" aria-hidden="true"></span>':icon('info'))+'<strong>'+escapeHtml(title)+'</strong><p>'+escapeHtml(text)+'</p></div>';
const pad = n => String(n).padStart(2, '0');

const shortName = value => {
  const name = String(value || '예약됨');
  const chars = [...name];
  return chars.length > 3 ? `${chars.slice(0, 3).join('')}...` : name;
};

const today = () => {
  const d = new Date();

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fmt = d => {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(new Date(`${d}T00:00:00`));
};

const fmtTime = value => new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Seoul'
}).format(new Date(value));

const state = {
  primary:
    new URLSearchParams(location.search).get('room') === '8319'
      ? '8319'
      : '8318',

  date: today(),
  tab: 'status',
  rows: [],
  loadVersion: 0
};


/*
 * 전체 화면 기본 구조
 */
function shell() {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <a class="skip-link" href="#main">본문으로 건너뛰기</a>
    <header class="top"><div class="topin">
      <a class="service-brand" href="./" aria-label="프로젝트실 예약 홈">
        <span class="portal-mark" aria-hidden="true"><span></span></span>
        <span class="service-brand-copy"><strong>빅데이터소프트웨어공학과</strong><small>프로젝트실 예약</small></span>
      </a>
      <div class="top-actions"><a class="portal-link" href="https://portal.k-bigdata.kr/">통합 포털 ↗</a></div>
    </div></header>
    <nav class="nav" aria-label="프로젝트실 메뉴"><div class="navin">
      <button data-tab="status">${icon('room')}<span>현황</span></button>
      <button data-tab="book">${icon('book')}<span>예약하기</span></button>
      <button data-tab="mine">${icon('mine')}<span>내 예약</span></button>
    </div></nav>
    <main class="main" id="main"></main>
  `;


  document.querySelectorAll('[data-tab]').forEach(button => {

    button.onclick = async () => {

      state.tab = button.dataset.tab;

      await load();

    };

  });
}


/*
 * 오늘부터 5일간 날짜 생성
 */
function dates() {

  return [0, 1, 2, 3, 4].map(i => {

    const d = new Date();

    d.setDate(d.getDate() + i);

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  });

}


/*
 * 예약 현황
 */
function status() {

  const main = document.querySelector('.main');

  if (!main) {
    console.error('.main 요소를 찾을 수 없습니다.');
    return;
  }


  main.innerHTML = `

    <section class="card hero"><div class="section-eyebrow">PROJECT ROOM</div><h2>함께 배우는 공간, 프로젝트실</h2><p>예약 현황을 확인하고 원하는 프로젝트실을 선택하세요.</p><div class="badges"><span>학과 학생 전용</span><span>음식물 섭취 불가</span></div></section>
    <div class="section-heading"><h2>예약 현황</h2><span class="small">09:00–22:00</span></div>
    <div class="datebar">

      ${dates().map(d => `

        <button
          class="datebtn ${d === state.date ? 'active' : ''}"
          aria-pressed="${d === state.date}" data-date="${d}"
        >
          ${fmt(d)}${d === today() ? '<small>오늘</small>' : ''}
        </button>

      `).join('')}

    </div>


    <div class="roomgrid">

      ${rooms.map(room => {

        const rows = state.rows.filter(
          item => item.room === room
        );

        return `

          <button type="button"
            class="roomcard ${room === state.primary ? 'primary' : ''}"
            data-room="${room}"


            aria-label="프로젝트실 ${room} 예약하기"
          >

            <div class="roomtitle">
              ${icon('room')}<span>${room}<small>프로젝트실</small></span>
            </div>


            <span class="tag">
              ${
                room === state.primary
                  ? '선택됨'
                  : '예약하기 →'
              }
            </span>


            <div class="schedule">

              ${
                rows.length

                  ? rows.map(item => `

                      <div class="slot">

                        <span class="time">
                          ${fmtTime(item.start)}
                          –
                          ${fmtTime(item.end)}
                        </span>

                        <span class="reservation-name" title="예약 정보">
                          예약됨<small class="purpose">${escapeHtml(purposeLabels[item.purpose] || item.purpose)}</small>
                        </span>

                      </div>

                    `).join('')

                  : `
                      <div class="empty">
                        <strong>등록된 예약 없음</strong><span>프로젝트실을 눌러 예약하세요.</span>
                      </div>
                    `
              }

            </div>

          </button>

        `;

      }).join('')}

    </div>
    ${notice()}
  `;


    document
      .querySelectorAll('[data-date]')
    .forEach(button => {

      button.onclick = async () => {

        state.date = button.dataset.date;

        await load();

      };

    });

  document
    .querySelectorAll('[data-room]')
    .forEach(card => {
      const openBooking = async () => {
        state.primary = card.dataset.room;
        state.tab = 'book';
        await load();
      };

      card.onclick = openBooking;
    });

}


/*
 * 예약하기
 */
function book() {

  const main = document.querySelector('.main');

  if (!main) {
    console.error('.main 요소를 찾을 수 없습니다.');
    return;
  }


  main.innerHTML = `

    <section class="card">

      <h2>
        예약하기
      </h2>


      <p class="small">
        운영시간 09:00–22:00 ·
        30분 단위 ·
        최대 3시간
      </p>


      <form id="form">


        <div class="field">

          <label>
            프로젝트실
          </label>


          <div class="datebar">

            ${rooms.map(room => `

              <button
                type="button"
                class="roombtn ${room === state.primary ? 'active' : ''}"
                data-room="${room}"
              >
                ${room}
              </button>

            `).join('')}

          </div>


          <input
            type="hidden"
            name="room"
            value="${state.primary}"
          >

        </div>


        <div class="twocol">


          <div class="field">

            <label for="날짜">날짜</label>
<input id="날짜"
              name="date"
              type="date"
              value="${state.date}"
              required
            >

          </div>


          <div class="field">

            <label for="용도">용도</label>
<select id="용도" name="purpose">

              ${purposes.map(purpose => `

                <option value="${purpose}">
                  ${purposeLabels[purpose]}
                </option>

              `).join('')}

            </select>

          </div>


        </div>


        <div class="twocol">


          <div class="field">

            <label for="시작">시작</label>
<input id="시작"
              name="start"
            type="time"
            value="09:00"
            min="09:00"
            max="22:00"
              step="1800"
              required
            >

          </div>


          <div class="field">

            <label for="종료">종료</label>
<input id="종료"
              name="end"
            type="time"
            value="10:00"
            min="09:00"
            max="22:00"
              step="1800"
              required
            >

          </div>


        </div>


        <div class="field">

          <label for="예약자이름">예약자 이름</label>
<input id="예약자이름"
            name="name"
            maxlength="3"
            minlength="1"
            required
          >

        </div>


        <div class="field">

          <label for="학번">학번</label>
<input id="학번"
            name="studentId"
            inputmode="numeric"
            maxlength="20"
            required
          >

        </div>


        <div class="field">

          <label for="메모선택">메모 (선택)</label>
<textarea id="메모선택"
            name="memo"
            maxlength="200"
          ></textarea>

        </div>


        <div class="field">

          <label for="취소용자리PIN">취소용 4자리 PIN</label>
<input id="취소용자리PIN"
            name="pin"
            inputmode="numeric"
            pattern="[0-9]{4}"
            maxlength="4"
            required
          >

        </div>


        <label class="small">

          <input
            type="checkbox"
            required
          >

          예약 정보를 확인했습니다.

        </label>


        <p>

          <button class="primarybtn" type="submit">
            예약 등록
          </button>

        </p>


      </form>


      ${notice()}<div id="bookResult" aria-live="polite"></div>


    </section>

  `;


  document
    .querySelectorAll('[data-room]')
    .forEach(button => {

      button.onclick = () => {

        const roomInput =
          document.querySelector('[name="room"]');

        if (roomInput) {
          roomInput.value = button.dataset.room;
        }


        document
          .querySelectorAll('[data-room]')
          .forEach(item => {

            item.classList.toggle(
              'active',
              item === button
            );

          });

      };

    });


  const form =
    document.querySelector('#form');

  if (form) {
    form.onsubmit = submitBook;
  }

}


/*
 * 예약 등록
 */
async function submitBook(e) {

  e.preventDefault();

  const submitButton = e.target.querySelector('button[type="submit"]');
  if (submitButton?.disabled) return;
  if (submitButton) submitButton.disabled = true;


  const formData =
    new FormData(e.target);


  const data =
    Object.fromEntries(formData);


  const out =
    document.querySelector('#bookResult');


  out.innerHTML = stateCard('예약을 등록하고 있습니다.', '잠시만 기다려 주세요.', 'loading');


  try {

    const result =
      await api.createReservation(data);


    out.innerHTML = `

      <div class="result">

        <b>
          예약이 완료되었습니다.
        </b>

        <p>
          예약번호:
          <strong>
            ${result.reservationId}
          </strong>
        </p>

        <p class="small">
          예약번호와 학번, PIN으로
          내 예약에서 취소할 수 있습니다.
        </p>

      </div>

    `;


    e.target.reset();

  } catch (err) {

    console.error(err);


    out.innerHTML = stateCard('요청을 완료하지 못했습니다.', err.message, 'error');

  } finally {

    if (submitButton) submitButton.disabled = false;

  }

}


/*
 * 내 예약
 */
function mine() {

  const main =
    document.querySelector('.main');


  if (!main) {

    console.error(
      '.main 요소를 찾을 수 없습니다.'
    );

    return;

  }


  main.innerHTML = `

    <section class="card">

      <h2>
        내 예약
      </h2>


      <p class="small">
        예약할 때 입력한 학번과 PIN을 입력하세요.
      </p>


      <form id="lookup">


        <div class="field">

          <label for="학번">학번</label>
<input id="학번"
            name="studentId"
            required
          >

        </div>


        <div class="field">

          <label for="자리PIN">4자리 PIN</label>
<input id="자리PIN"
            name="pin"
            inputmode="numeric"
            pattern="[0-9]{4}"
            maxlength="4"
            required
          >

        </div>


        <button class="primarybtn">
          조회
        </button>


      </form>


      ${notice()}<div id="mineResult" aria-live="polite"></div>


    </section>

  `;


  const lookupForm =
    document.querySelector('#lookup');


  if (lookupForm) {
    lookupForm.onsubmit = lookup;
  }

}


/*
 * 내 예약 조회
 */
async function lookup(e) {

  e.preventDefault();


  const formData =
    new FormData(e.target);


  const studentId =
    formData.get('studentId');


  const pin =
    formData.get('pin');


  const out =
    document.querySelector('#mineResult');


  out.innerHTML = stateCard('예약을 조회하고 있습니다.', '잠시만 기다려 주세요.', 'loading');

  try {

    const result =
      await api.findReservation(
        studentId,
        pin
      );


    if (result.reservations?.length) {

      out.innerHTML =
        result.reservations.map(item => `

          <article class="card">

            <b>프로젝트실 ${escapeHtml(item.room)}</b><p>${fmt(item.start.slice(0, 10))}</p>


            <p>

              ${fmtTime(item.start)}
              –
              ${fmtTime(item.end)}

              ·

              ${escapeHtml(purposeLabels[item.purpose] || item.purpose)}

            </p>


            <p class="small">예약번호: ${escapeHtml(item.reservationId)}</p>
            <p class="small">
              ${escapeHtml(item.memo || '')}
            </p>


            ${
              item.status === 'ACTIVE'

                ? `

                    <button
                      class="secondary danger"
                      data-cancel="${item.reservationId}"
                    >
                      예약 취소
                    </button>

                  `

                : `

                    <span class="small">
                      취소됨
                    </span>

                  `
            }


          </article>

        `).join('');


      document
        .querySelectorAll('[data-cancel]')
        .forEach(button => {

          button.onclick = () => {

            cancel(
              button.dataset.cancel,
              studentId,
              pin
            );

          };

        });

    } else {

      out.innerHTML = stateCard('예약 내역이 없습니다.', '입력한 학번과 PIN을 확인해 주세요.');

    }

  } catch (err) {

    console.error(err);


    out.innerHTML = stateCard('요청을 완료하지 못했습니다.', err.message, 'error');

  }

}


/*
 * 예약 취소
 */
async function cancel(
  reservationId,
  studentId,
  pin
) {

  if (
    !confirm(
      '이 예약을 취소할까요?'
    )
  ) {
    return;
  }


  try {

    await api.cancelReservation({

      reservationId,
      studentId,
      pin

    });


    const form =
      document.querySelector('#lookup');


    if (form) {

      await lookup({

        preventDefault() {},

        target: form

      });

    }

  } catch (err) {

    console.error(err);

    alert(err.message);

  }

}


/*
 * 화면 전체 로드
 */
async function load() {

  const version = ++state.loadVersion;

  shell();


  document
    .querySelectorAll('[data-tab]')
    .forEach(button => {

      button.classList.toggle('active', button.dataset.tab === state.tab);
      button.setAttribute('aria-current', button.dataset.tab === state.tab ? 'page' : 'false');

    });


  if (state.tab === 'status') {

    const main = document.querySelector('.main');
    main.innerHTML = stateCard('예약 현황을 불러오고 있습니다.', '잠시만 기다려 주세요.', 'loading');

    try {

      const result =
        await api.reservations(
          state.date
        );


      state.rows =
        result.reservations || [];

    } catch (err) {

      console.error(
        '예약현황 조회 실패:',
        err
      );


      if (version !== state.loadVersion || state.tab !== 'status') return;
      main.innerHTML = stateCard('예약 현황을 불러오지 못했습니다.', err.message, 'error') + '<button class="secondary" id="retry">다시 시도</button>';
      document.querySelector('#retry').onclick = load;
      return;
    }

    if (version !== state.loadVersion || state.tab !== 'status') return;


    status();

  }


  else if (
    state.tab === 'book'
  ) {

    book();

  }


  else {

    mine();

  }


  document
    .querySelectorAll('[data-tab]')
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.tab === state.tab
      );

    });

}


/*
 * 최초 실행
 */
load();
