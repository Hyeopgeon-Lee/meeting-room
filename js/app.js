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
    <header class="top">
      <div class="topin">

        <div class="eyebrow">
          빅데이터소프트웨어공학과
        </div>

        <div class="brand">
          프로젝트실 예약
        </div>

      </div>
    </header>

    <main class="main"></main>

    <nav class="nav">
      <div class="navin">

        <button data-tab="status">
          현황
        </button>

        <button data-tab="book">
          예약하기
        </button>

        <button data-tab="mine">
          내 예약
        </button>

      </div>
    </nav>
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

    <section class="card hero">

      <h1>
        프로젝트실을 간편하게 예약하세요
      </h1>

      <p>
        8318·8319 프로젝트실의 예약 현황을 확인하고 예약할 수 있습니다.
      </p>

    </section>


    <div class="datebar">

      ${dates().map(d => `

        <button
          class="datebtn ${d === state.date ? 'active' : ''}"
          data-date="${d}"
        >
          ${fmt(d)}
        </button>

      `).join('')}

    </div>


    <div class="roomgrid">

      ${rooms.map(room => {

        const rows = state.rows.filter(
          item => item.room === room
        );

        return `

          <article
            class="roomcard ${room === state.primary ? 'primary' : ''}"
            data-room="${room}"
            role="button"
            tabindex="0"
            aria-label="프로젝트실 ${room} 예약하기"
          >

            <div class="roomtitle">
              ${room}호
            </div>


            <span class="tag">
              ${
                room === state.primary
                  ? '현재 선택'
                  : '다른 프로젝트실'
              }
            </span>


            <div class="schedule">

              ${
                rows.length

                  ? rows.map(item => `

                      <div class="slot">

                        <span class="time">
                          ${item.start.slice(11, 16)}
                          –
                          ${item.end.slice(11, 16)}
                        </span>

                        <span class="reservation-name" title="예약자 이름">
                          ${shortName(item.name)}
                        </span>

                      </div>

                    `).join('')

                  : `
                      <div class="empty">
                        예약 없음
                      </div>
                    `
              }

            </div>

          </article>

        `;

      }).join('')}

    </div>

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
      card.onkeydown = event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openBooking();
        }
      };
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

            <label>
              날짜
            </label>

            <input
              name="date"
              type="date"
              value="${state.date}"
              required
            >

          </div>


          <div class="field">

            <label>
              용도
            </label>

            <select name="purpose">

              ${purposes.map(purpose => `

                <option>
                  ${purpose}
                </option>

              `).join('')}

            </select>

          </div>


        </div>


        <div class="twocol">


          <div class="field">

            <label>
              시작
            </label>

            <input
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

            <label>
              종료
            </label>

            <input
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

          <label>
            예약자 이름
          </label>

          <input
            name="name"
            maxlength="30"
            required
          >

        </div>


        <div class="field">

          <label>
            학번
          </label>

          <input
            name="studentId"
            inputmode="numeric"
            maxlength="20"
            required
          >

        </div>


        <div class="field">

          <label>
            메모 (선택)
          </label>

          <textarea
            name="memo"
            maxlength="200"
          ></textarea>

        </div>


        <div class="field">

          <label>
            취소용 4자리 PIN
          </label>

          <input
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

          <button class="primarybtn">
            예약 등록
          </button>

        </p>


      </form>


      <div id="bookResult"></div>


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

  const submitButton = e.target.querySelector('button[type="submit"], button');
  if (submitButton?.disabled) return;
  if (submitButton) submitButton.disabled = true;


  const formData =
    new FormData(e.target);


  const data =
    Object.fromEntries(formData);


  const out =
    document.querySelector('#bookResult');


  out.innerHTML = `

    <p class="small">
      예약 가능 여부를 확인하고 있습니다…
    </p>

  `;


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


    out.innerHTML = `

      <p class="danger">
        ${err.message}
      </p>

    `;

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

          <label>
            학번
          </label>

          <input
            name="studentId"
            required
          >

        </div>


        <div class="field">

          <label>
            4자리 PIN
          </label>

          <input
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


      <div id="mineResult"></div>


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

            <b>
              ${item.room}호
              ·
              ${item.start.slice(0, 10)}
            </b>


            <p>

              ${item.start.slice(11, 16)}
              –
              ${item.end.slice(11, 16)}

              ·

              ${item.purpose}

            </p>


            <p class="small">
              ${item.memo || ''}
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

      out.innerHTML = `

        <p class="empty">
          예약 내역이 없습니다.
        </p>

      `;

    }

  } catch (err) {

    console.error(err);


    out.innerHTML = `

      <p class="danger">
        ${err.message}
      </p>

    `;

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

      button.classList.toggle(
        'active',
        button.dataset.tab === state.tab
      );

    });


  if (state.tab === 'status') {

    const main = document.querySelector('.main');
    main.innerHTML = `
      <section class="card hero">
        <h1>프로젝트실 예약 현황</h1>
        <p>예약 현황을 불러오는 중입니다…</p>
      </section>
    `;

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


      state.rows = [];

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
