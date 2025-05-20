modals = ["#modal-content-lembar-jawaban-print"];
fillModalContent(modals);

generateSidebar();

async function getData() {
  const [mataLombaRes, pesertaRes] = await Promise.all([
    fetch('/loadLomba', { method: 'POST' }).then(res => res.json()),
    fetch('/loadPeserta', { method: 'POST' }).then(res => res.json())
  ]);

  return {
    mataLomba: mataLombaRes.data ? Object.values(mataLombaRes.data) : [], // Jika data tidak ada, gunakan array kosong
    peserta: pesertaRes.data ? Object.values(pesertaRes.data) : [] // Jika data tidak ada, gunakan array kosong
  };
}

async function generateSidebar() {
  const { mataLomba } = await getData();
  const lombaData = mataLomba;
  let container = document.getElementById("lomba-container");
  let groupedByKategori = {};

  // Kelompokkan lomba berdasarkan kategori
  lombaData.forEach(item => {
    if (!groupedByKategori[item.nama_kategori]) {
      groupedByKategori[item.nama_kategori] = [];
    }
    groupedByKategori[item.nama_kategori].push(item);
  });

  // Membuat tampilan sidebar berdasarkan kategori
  let sidebarHTML = '';
  for (let kategori in groupedByKategori) {
    // Mengganti spasi dengan tanda _ agar bisa menjadi kelas yang valid
    let kategoriClass = kategori.replace(/\s+/g, '_');

    // Tambahkan tombol untuk toggle kategori
    sidebarHTML += `
      <div class="kategori-header" onclick="toggleKategori('${kategoriClass}')">
        <span class="toggle-icon">+</span> ${kategori}
      </div>
      <div class="lomba-list ${kategoriClass}" style="display:block;">`; // Default tampil
    groupedByKategori[kategori].forEach(lomba => {
      sidebarHTML += `
        <div class="lomba-header" data-kategori-id="${lomba.kategori_id}" data-lomba-id="${lomba.lomba_id}" onclick="handleLombaHeaderClick(event)">
          <i class="bi bi-folder-fill"></i> <span>${lomba.nama_lomba}</span>
        </div>`;
    });
    sidebarHTML += `</div>`;
  }

  container.innerHTML = sidebarHTML;
}

// Fungsi untuk menangani klik pada lombaHeader, ditambahkan di dalam HTML lewat 'onclick'
function handleLombaHeaderClick(event) {
  let lombaHeaders = document.getElementsByClassName('lomba-header');

  // Hapus kelas 'active' dari semua elemen
  for (let header of lombaHeaders) {
    header.classList.remove('active');
  }

  // Tambahkan kelas 'active' pada yang diklik
  event.currentTarget.classList.add('active');

  // Menampilkan peserta yang sesuai dengan lomba yang dipilih
  let lombaId = event.currentTarget.getAttribute('data-lomba-id');
  showParticipants(lombaId);
}


// Fungsi untuk toggle kategori
function toggleKategori(kategoriClass) {
  let kategoriDiv = document.querySelector(`.${kategoriClass}`);
  let toggleIcon = document.querySelector(`.${kategoriClass} .toggle-icon`);

  // Jika kategori terlihat, sembunyikan, jika tersembunyi, tampilkan
  if (kategoriDiv.style.display === "none") {
    kategoriDiv.style.display = "block";
    toggleIcon.textContent = "-";
  } else {
    kategoriDiv.style.display = "none";
    toggleIcon.textContent = "+";
  }
}

async function showParticipants(lombaId) {
  const { peserta } = await getData(); 
  pesertaData = peserta

  console.log('pesertaData', pesertaData)
  let details = document.getElementById("detail-lembar-jawaban-peserta");
  details.innerHTML = ""; // Reset tampilan sebelumnya

  // Filter peserta berdasarkan lomba_id
  let filteredPeserta = pesertaData.filter(item => item.lomba_id == lombaId);

  if (filteredPeserta.length === 0) {
    details.innerHTML = `<h3>Tidak ada peserta untuk lomba ini</h3>`;
    return;
  }

  let lombaNama = filteredPeserta[0].nama_lomba;

  // Membuat tabel untuk menampilkan peserta
  let table = document.createElement("table");
  table.classList.add("info-table");

  let thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th class="head-peserta">No Peserta</th>
      <th class="head-regu">Regu</th>
      <th class="head-pangkalan">Pangkalan</th>
      <th class="head-lomba">Lomba</th>
      <th class="head-act">Action</th>
    </tr>
  `;
  table.appendChild(thead);

  let tbody = document.createElement("tbody");
  filteredPeserta.forEach((item, index) => {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td id-peserta="${item.id}" no-peserta="${item.no_peserta}" class="col-peserta"><i class="bi bi-file-earmark-person-fill"></i> ${item.no_peserta}</td>
      <td class="col-regu">${item.regu}</td>
      <td class="col-pangkalan">${item.nama_pangkalan}</td>
      <td id-lomba="${item.lomba_id}" class="col-lomba">${item.nama_lomba}</td>
      <td class="col-action"><button onclick="printLembarJawabanModal(this, 'view')"><i class="bi bi-file-earmark-pdf-fill"></i></button></td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  details.appendChild(table);
}

async function printLembarJawabanModal(el, act) {
  openLoader()
  if (act == 'view') {
  
    // CLONE FORM PRINT
    const clonedCanvasMain = document.querySelector('#form-lembar-jawaban .canvas-content').cloneNode(true)
    document.getElementById('form-lembar-jawaban-temp').innerHTML = ''
    document.getElementById('form-lembar-jawaban-temp').appendChild(clonedCanvasMain)
    // SET WRAP PRINT SECTION
    const sectionMainContent = document.querySelector('#modal-content-lembar-jawaban-print .modal-content')
    const wrapContentPrintPreview = document.querySelector('#wrap-content-print-preview')
    if (wrapContentPrintPreview) {
      wrapContentPrintPreview.remove()
    }
    sectionMainContent.innerHTML += '<section id="wrap-content-print-preview"></section>'

    // SET VARIABEL VALUE TO PRINT
    const wrapContentPrint = sectionMainContent.querySelector('#wrap-content-print-preview')
    const wrapFormPrint = sectionMainContent.querySelector('#form-lembar-jawaban-temp')

    // SET DATA HEADER

    idPesertaQr = el.closest('tr').querySelector('.col-peserta').getAttribute('id-peserta')
    noPesertaQr = el.closest('tr').querySelector('.col-peserta').getAttribute('no-peserta')
    idLombaQr = el.closest('tr').querySelector('.col-lomba').getAttribute('id-lomba')
    idKategoriLombaQr = document.querySelector('.lomba-header.active').getAttribute('data-kategori-id')
    reguPeserta = el.closest('tr').querySelector('.col-regu').textContent
    pangkalanPeserta = el.closest('tr').querySelector('.col-pangkalan').textContent
    mataLomba = el.closest('tr').querySelector('.col-lomba').textContent

    wrapContentPrint.setAttribute('title-text', `Lembar Jawaban ${noPesertaQr} - ${mataLomba}`)
    wrapFormPrint.querySelector('#nama-regu-field').innerHTML = `: ${reguPeserta}`
    wrapFormPrint.querySelector('#no-peserta-field').innerHTML = `: ${noPesertaQr}`
    wrapFormPrint.querySelector('#nama-pangkalan-field').innerHTML = `: ${pangkalanPeserta}`
    wrapFormPrint.querySelector('#mata-lomba-field').innerHTML = `: ${mataLomba}`
    wrapFormPrint.querySelector('.title-lembar-jawaba-lomba').textContent = `LEMBAR JAWABAN ${mataLomba}`

    // CLONE CANVAS AND OPEN MODAL 
    const clonedCanvas = document.querySelector('#form-lembar-jawaban-temp .canvas-content').cloneNode(true)
    wrapContentPrint.appendChild(clonedCanvas)

    document.querySelector('#wrap-content-print-preview .qr-box-section').innerHTML = `<div style="display: grid ;justify-content: right;" class="qr-container" id="qr-container">`
    openModal("#modal-content-lembar-jawaban-print")

    // SET QRCODE LEMBAR JAWABAN
    textQr = `${noPesertaQr}/${idLombaQr}/${idKategoriLombaQr}/${mataLomba}`
    console.log(textQr)
    await new Promise((resolve, reject) => {
      new QRCode(document.getElementById('qr-container'), {
        text: textQr,
        width: 80,
        height: 80,
        correctLevel: QRCode.CorrectLevel.L,
      });
      resolve('QR code generated');
    });


    closeLoader()
  }

  if (act == 'print') {
    docName = document.querySelector('#wrap-content-print-preview').getAttribute('title-text')
    canvasWidth = 592+3
    canvasHeight = 837+3

    await generateHtmlToPdf('wrap-content-print-preview', {
      pdfWidth: canvasWidth + 27,
      pdfHeight: canvasHeight + 30,
      canvasName: 'page-canvas',
      canvasType: 'P',
      fileType: 'filePdf',
      fileName: docName,
      cssOptions: {
        "*": {
          "font-family": "'PT Sans', sans-serif",
          "color": "black",
          "font-size": "10px"
        },
        ".title-text": {
          "font-size": "14px",
          "font-weight": "bold"
        },
        // "td, th": {
        //   "background": "white"
        // },
        ".check": {
          "background": "black",
          "color": "white"
        },
        ".title-check": {
          "font-size": "8px"
        }

      }
    })
    closeLoader()
  }
}
