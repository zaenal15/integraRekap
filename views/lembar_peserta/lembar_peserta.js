modals = ["#modal-content-lembar-jawaban-print", "#modal-lampiran-lembar-juri"];
fillModalContent(modals);

async function getData() {
  let [kategoriLombaRes, mataLombaRes, nilaiLombaRes, pesertaRes] = await Promise.all([
    fetch('/loadKategoriLomba', {
      method: 'POST'
    }).then(res => res.json()),
    fetch('/loadLomba', {
      method: 'POST'
    }).then(res => res.json()),
    fetch('/loadNilaiLomba', {
      method: 'POST'
    }).then(res => res.json()),
  ]);

  return {
    kategoriLomba: kategoriLombaRes.data ? Object.values(kategoriLombaRes.data) : [], // Jika data tidak ada, gunakan array kosong
    mataLomba: mataLombaRes.data ? Object.values(mataLombaRes.data) : [], // Jika data tidak ada, gunakan array kosong
    nilaiLomba: nilaiLombaRes.data ? Object.values(nilaiLombaRes.data) : [], // Jika data tidak ada, gunakan array kosong
  };
}



async function showSubPointPeserta(noPeserta) {
  let { kategoriLomba, mataLomba } = await getData();

  const tableSection = document.querySelector('#table-mata-lomba-section');
  const promises = mataLomba.map(async (item) => {
    const sectionContent = `
      <section class="wrap-lembar-rekap" lamba-id="${item.lomba_id}" nama-lomba="${item.nama_lomba}">
        <h3 class="head-title-lembar-rekap">LEMBAR PENILAIAN PESERTA ${item.nama_lomba}</h3>
        <section class="content-tb-lembar-rekap">
          <section class="content-nilai-rekap">
            <table class="tabel-rekap-nilai-lomba" lamba-id="${item.lomba_id}" nama-lomba="${item.nama_lomba}">
              <tbody></tbody>
            </table>
          </section>
          <section class="content-nilai-rekap-akhir">
            <table class="tabel-rekap-pengurangan-nilai-lomba" lamba-id="${item.lomba_id}" nama-lomba="${item.nama_lomba}">
              <thead>
                <tr><th colspan="4">POINT PENGURANGAN ${item.nama_lomba}</th></tr>
                <tr><th>Nama Kategori</th><th>Peraturan</th><th>Point</th><th>Total Point</th></tr>
              </thead>
              <tbody><tr><td colspan="4"><center>Tidak Ada Point Pengurangan</center></td></tr></tbody>
            </table>
            <table class="tabel-rekap-akhir-nilai-lomba" lamba-id="${item.lomba_id}" nama-lomba="${item.nama_lomba}">
              <thead>
                <tr><th colspan="5">REKAP ${item.nama_lomba}</th></tr>
                <tr><th>No</th><th>Kategori</th><th>Nilai</th><th>Point Pinalti</th><th>Total Akhir</th></tr>
              </thead>
              <tbody><tr><td colspan="5"><center>Tidak ada Rekap</center></td></tr></tbody>
            </table>
          </section>
        </section>
      </section>
    `;
    tableSection.innerHTML += sectionContent;

    // Batch async loading for each section
    return Promise.all([
      setSubPointContent(item.lomba_id, noPeserta),
      setKategoriPenguranganPoint(item.lomba_id, noPeserta),
      setRekapAkhir(item.lomba_id, noPeserta),
    ]);
  });

  await Promise.all(promises);
}

async function setSubPointContent(lombaId, noPeserta) {
  try {
    const formData = new FormData();
    formData.append('lomba_id', lombaId);

    const [subPointResponse, mataLombaData] = await Promise.all([
      fetch('/loadSubPointList', { method: 'POST', body: formData }).then(res => res.json()),
      getData()
    ]);

    const subPointData = subPointResponse.data;
    const lombaData = mataLombaData.mataLomba;
    const lomba = lombaData.find(item => item.lomba_id === Number(lombaId));
    const totalJuri = lomba?.jumlah_juri || 0;

    const tableBody = document.querySelector(`.tabel-rekap-nilai-lomba[lamba-id="${lombaId}"] tbody`);
    tableBody.innerHTML = ''; // Clear existing content

    if (subPointData) {
      const groupedData = subPointData.reduce((acc, item) => {
        acc[item.nama_kategori_sub_point] = acc[item.nama_kategori_sub_point] || [];
        acc[item.nama_kategori_sub_point].push(item);
        return acc;
      }, {});

      let content = '';
      for (const category in groupedData) {
        const headerSubPoint = `
          <tr class="category-header">
            <td class="head-judul-sub-point">${category}</td>
            ${Array.from({ length: totalJuri }, (_, index) => `<td style="width:80px;" class="head-juri">Juri ${index + 1}</td>`).join('')}
            <td class="head-total">Total</td>
          </tr>
        `;
        content += headerSubPoint;

        groupedData[category].forEach(item => {
          content += `
            <tr data-id="${item.sub_point_id}" kategori-sub_point-id="${item.kategori_sub_point_id}" kategori-id="${item.kategori_id}" class="row-sub-point">
              <td>${item.nama_sub_point}</td>
              ${Array.from({ length: totalJuri }, (_, index) => `<td class="col-juri" data-juri="juri ${index + 1}" data-id="0"></td>`).join('')}
              <td class="col-total total-column">0</td>
            </tr>
          `;
        });
      }

      tableBody.innerHTML = content;

      await setNilaiJuri(lombaId, noPeserta)
    }
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

async function setKategoriPenguranganPoint(lombaId, noPeserta) {
  try {
    const formData = new FormData();
    formData.append('lomba_id', lombaId);

    const [kategoriPenilaianResponse, kriteriaPenguranganResponse] = await Promise.all([
      fetch('/loadKategoriPenilaian', { method: 'POST', body: formData }).then(res => res.json()),
      fetch('/loadKategoriPenguranganPoint', { method: 'POST', body: formData }).then(res => res.json())
    ]);

    const kategoriData = kategoriPenilaianResponse.data;
    const kriteriaPenguranganData = kriteriaPenguranganResponse.data;
    let tableContent = '';

    // Render kategori dari kategoriData
    kategoriData.forEach(value => {
      const dataKriteriaList = kriteriaPenguranganData.filter(item => item.kategori_id === value.kategori_id);
      if (dataKriteriaList.length > 0) {
        dataKriteriaList.forEach((item, index) => {
          const itemKriteriaArr = item.kriteria_point_pengurangan.split('-').filter(val => val.trim() !== "");
          const itemContent = itemKriteriaArr.length > 1
            ? itemKriteriaArr.map((val, idx) => `<span style="display: block;">${idx + 1}. ${val.trim()}</span>`).join('')
            : `<span style="display: block;">${itemKriteriaArr[0].trim()}</span>`;

          tableContent += `
        <tr class="row-pengurangan" data-id="${item.id}" kategori-id="${item.kategori_id}">
          ${index === 0 ? `<td rowspan="${dataKriteriaList.length}">${value.nama_kategori}</td>` : ''}
          <td>${itemContent}</td>
          <td data-id="${item.id}" class="pengurangan-nilai-field">0</td>
          ${index === 0 ? `<td class="pengurangan-nilai-total" kategori-id="${item.kategori_id}" rowspan="${dataKriteriaList.length}">0</td>` : ''}
        </tr>
      `;
        });
      }
    });

    // Tambahkan manual kategori_id = 0 (Pengurangan Pasukan)
    const umumKriteriaList = kriteriaPenguranganData.filter(item => item.kategori_id === 0);
    if (umumKriteriaList.length > 0) {
      umumKriteriaList.forEach((item, index) => {
        const itemKriteriaArr = item.kriteria_point_pengurangan.split('-').filter(val => val.trim() !== "");
        const itemContent = itemKriteriaArr.length > 1
          ? itemKriteriaArr.map((val, idx) => `<span style="display: block;">${idx + 1}. ${val.trim()}</span>`).join('')
          : `<span style="display: block;">${itemKriteriaArr[0].trim()}</span>`;

        tableContent += `
      <tr class="row-pengurangan" data-id="${item.id}" kategori-id="0">
        ${index === 0 ? `<td rowspan="${umumKriteriaList.length}">Pengurangan Pasukan</td>` : ''}
        <td>${itemContent}</td>
        <td data-id="${item.id}" class="pengurangan-nilai-field">0</td>
        ${index === 0 ? `<td class="pengurangan-nilai-total" kategori-id="0" rowspan="${umumKriteriaList.length}">0</td>` : ''}
      </tr>
    `;
      });
    }

    const kategoriListElement = document.querySelector(`.tabel-rekap-pengurangan-nilai-lomba[lamba-id="${lombaId}"] tbody`);
    if (kategoriListElement) {
      if (tableContent.length > 0) {
        kategoriListElement.innerHTML = tableContent;
      }
    }

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

async function setRekapAkhir(lombaId, noPeserta) {
  try {
    const formData = new FormData();
    formData.append('lomba_id', lombaId);

    const kategoriPenilaianResponse = await fetch('/loadKategoriPenilaian', {
      method: 'POST',
      body: formData
    });

    const kategoriData = (await kategoriPenilaianResponse.json()).data;

    let tableContent = '';
    let noUrut = 1;
    namaLomba = document.querySelector(`.tabel-rekap-akhir-nilai-lomba[lamba-id="${lombaId}"]`).getAttribute('nama-lomba')

    kategoriData.forEach(value => {
      tableContent += `
        <tr class="row-rekap" kategori-id="${value.kategori_id}">
          <td class="col-no">${noUrut++}</td>
          <td class="col-kategori">${value.nama_kategori}</td>
          <td class="col-nilai">0</td>
          <td kategori-id="${value.kategori_id}" class="col-nilai-pinalti">0</td>
          <td class="col-total-akhir">0</td>
        </tr>`;
    });

    textPinalti = lombaId == 11 ? 'Pengurangan Pasukan' : 'General Pinalti'
    tableContent += `
    <tr class="row-rekap">
      <td class="col-footer-sub-total" colspan="3">Sub Total</td>
      <td colspan="2" class="col-footer-nilai-sub-total">0</td>
    </tr>
    <tr class="row-rekap">
      <td class="col-footer-point-pinalti" colspan="3">${textPinalti}</td>
      <td colspan="2" class="col-footer-nilai-pinalti">0</td>
    </tr>
      <tr class="row-rekap">
        <td class="col-footer-total-akhir" colspan="3">Total Akhir ${namaLomba}</td>
        <td colspan="2" class="col-footer-nilai-akhir">0</td>
      </tr>`;

    const kategoriListElement = document.querySelector(`.tabel-rekap-akhir-nilai-lomba[lamba-id="${lombaId}"] tbody`);
    if (kategoriListElement) {
      if (tableContent.length > 0) {
        kategoriListElement.innerHTML = tableContent;
      }
    }

    await updateAndCalculateTotal(lombaId, noPeserta)
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

async function setNilaiJuri(lombaId, noPeserta) {
  try {
    const formData = new FormData();
    formData.append('lomba_id', lombaId);
    formData.append('no_peserta', noPeserta);

    // Fetch the list of Juri scores
    const response = await fetch('/loadNilaiJuriList', { method: 'POST', body: formData });
    const data = (await response.json()).data;

    if (data) {
      // Loop through each score entry in the data
      data.forEach(item => {
        // Select the corresponding row based on sub_point_id, kategori_sub_point_id, and kategori_penilaian_id
        const row = document.querySelector(`.tabel-rekap-nilai-lomba[lamba-id="${lombaId}"]  .row-sub-point[data-id="${item.sub_point_id}"][kategori-sub_point-id="${item.kategori_sub_point_id}"][kategori-id="${item.kategori_penilaian_id}"]`);

        if (row) {
          // Find the correct input field for the specific Juri
          const input = row.querySelector(`.col-juri[data-juri="${item.nama_juri}"]`);

          if (input) {
            input.textContent = item.nilai_juri;  // Set the Juri score in the cell (use textContent for table cells)
            input.setAttribute('data-id', item.id);  // Set the data-id attribute for reference
          }
        }
      });

      // After updating the juri values, calculate and update the total for each row
      document.querySelectorAll(`.tabel-rekap-nilai-lomba[lamba-id="${lombaId}"] .row-sub-point`).forEach(row => {
        let total = 0;
        const juriCells = row.querySelectorAll('.col-juri');

        // Sum up the juri scores
        juriCells.forEach(cell => {
          total += parseFloat(cell.textContent) || 0;  // Add the juri score to total (if it's a number)
        });

        // Set the total value in the col-total
        const totalCell = row.querySelector('.col-total');
        if (totalCell) {
          totalCell.textContent = total;  // Set the total score in the col-total cell
        }
      });
    }

    return 'ok';
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    throw error;
  }
}
async function updateAndCalculateTotal(lombaId, noPeserta) {
  try {
    let kategoriTotals = {};
    const formData = new FormData();
    formData.append('lomba_id', lombaId);
    formData.append('no_peserta', noPeserta);

    const [subPointResponse, kategoriPenilaianResponse, penguranganResponse] = await Promise.all([
      fetch('/loadNilaiJuriList', { method: 'POST', body: formData }).then(res => res.json()),
      fetch('/loadKategoriPenilaian', { method: 'POST', body: formData }).then(res => res.json()),
      fetch('/loadPointPenguranganPeserta', { method: 'POST', body: formData }).then(res => res.json())
    ]);

    subPointData = subPointResponse.data || [];
    kategoriData = kategoriPenilaianResponse.data || [];
    penguranganData = penguranganResponse.data || [];

    // 1. Proses Nilai Juri per kategori
    kategoriData.forEach(kategori => {
      const kategoriId = kategori.kategori_id;
      const filteredData = subPointData.filter(item => item.kategori_penilaian_id === kategoriId);
      let totalNilai = filteredData.reduce((sum, item) => sum + (parseFloat(item.nilai_juri) || 0), 0);

      kategoriTotals[kategoriId] = kategoriTotals[kategoriId] || {};
      kategoriTotals[kategoriId].totalNilai = totalNilai;

      const nilaiElem = document.querySelector(`.row-rekap[kategori-id="${kategoriId}"] .col-nilai`);
      if (nilaiElem) nilaiElem.textContent = totalNilai;
    });

    // 2. Proses Nilai Pengurangan
    penguranganData.forEach(item => {
      const kategoriId = item.kategori_id;
      kategoriTotals[kategoriId] = kategoriTotals[kategoriId] || {};
      kategoriTotals[kategoriId].totalPengurangan = (kategoriTotals[kategoriId].totalPengurangan || 0) + (parseFloat(item.point_pengurangan) || 0);

      const field = document.querySelector(`.row-pengurangan[data-id="${item.kriteria_point_id}"][kategori-id="${item.kategori_id}"] .pengurangan-nilai-field`);
      if (field) {
        field.textContent = `-${item.point_pengurangan}`;
        field.setAttribute('kriteria-id', item.id);
        field.setAttribute('kategori-id', item.kategori_id); // Menambahkan kategori-id ke elemen
      }
    });


    // 3. Update total pengurangan dan tampilkan
    let totalAkhirNilaiPinalti = 0;

    for (const kategoriId in kategoriTotals) {
      const pengurangan = kategoriTotals[kategoriId].totalPengurangan || 0;

      // Tambahkan ke totalAkhirNilaiPinalti hanya jika kategoriId adalah "0"
      if (kategoriId === "0") {
        totalAkhirNilaiPinalti += pengurangan;
      }

      const totalElem = document.querySelector(`.pengurangan-nilai-total[kategori-id="${kategoriId}"]`);
      const rekapElem = document.querySelector(`.col-nilai-pinalti[kategori-id="${kategoriId}"]`);

      if (totalElem) totalElem.textContent = pengurangan === 0 ? '0' : `-${pengurangan}`;
      if (rekapElem) rekapElem.textContent = pengurangan === 0 ? '0' : `-${pengurangan}`;
    }

    const pinaltiFooter = document.querySelector(`.tabel-rekap-akhir-nilai-lomba[lamba-id="${lombaId}"] .col-footer-nilai-pinalti`);
    if (pinaltiFooter) pinaltiFooter.textContent = totalAkhirNilaiPinalti === 0 ? '0' : `-${totalAkhirNilaiPinalti}`;

    // 4. Kalkulasi total akhir tiap kategori
    const totalAkhirPerKategori = {};
    let totalAkhirNilai = 0;
    let subTotalNilai = 0;

    for (const kategoriId in kategoriTotals) {
      const nilai = kategoriTotals[kategoriId].totalNilai || 0;
      const pengurangan = kategoriTotals[kategoriId].totalPengurangan || 0;
      const total = nilai - pengurangan;

      totalAkhirPerKategori[kategoriId] = total;
      totalAkhirNilai += total;
      if (kategoriId !== "0") {
        penguranganSubTotal = kategoriTotals[kategoriId].totalPengurangan || 0;
        subtotal = nilai - penguranganSubTotal
        subTotalNilai += subtotal
      }

      const totalElem = document.querySelector(`.tabel-rekap-akhir-nilai-lomba[lamba-id="${lombaId}"] .row-rekap[kategori-id="${kategoriId}"] .col-total-akhir`);
      if (totalElem) totalElem.textContent = total;
    }

    // 5. Update semua Footer (Utama, Umum, Akhir)
    let footerSubTotal = document.querySelector(`.tabel-rekap-akhir-nilai-lomba[lamba-id="${lombaId}"] .col-footer-nilai-sub-total`);
    let footerAkhir = document.querySelector(`.tabel-rekap-akhir-nilai-lomba[lamba-id="${lombaId}"] .col-footer-nilai-akhir`);
    let footerUmum = document.querySelector(`.tabel-rekap-akhir-nilai-lomba[lamba-id="${lombaId}"] .col-footer-nilai-umum`);
    let footerUtama = document.querySelector(`.tabel-rekap-akhir-nilai-lomba[lamba-id="${lombaId}"] .col-footer-nilai-utama`);
    // const textUtama = document.querySelector(`.tabel-rekap-akhir-nilai-lomba[lamba-id="${lombaId}"] .col-footer-point-utama`);
    // const textUmum = document.querySelector(`.tabel-rekap-akhir-nilai-lomba[lamba-id="${lombaId}"] .col-footer-point-umum`);

    let totalUtama = 0, totalUmum = 0;
    let textUtamaVal = 'Utama (', textUmumVal = 'Umum (';

    kategoriData.forEach((kategori, index) => {
      const id = kategori.kategori_id;
      const isUtama = kategori.set_nilai === 'active';
      const isUmum = isUtama || kategori.nilai_umum === 'active';

      // Tambah teks label
      if (isUtama) {
        textUtamaVal += kategori.nama_kategori;
        const next = kategoriData[index + 1];
        if (next && next.set_nilai === 'active') textUtamaVal += ' + ';
      }
      if (isUmum) {
        textUmumVal += kategori.nama_kategori;
        const next = kategoriData[index + 1];
        if (next && (next.set_nilai === 'active' || next.nilai_umum === 'active')) textUmumVal += ' + ';
      }

      // Tambah nilai
      if (isUtama && totalAkhirPerKategori[id] !== undefined) totalUtama += totalAkhirPerKategori[id];
      if (isUmum && totalAkhirPerKategori[id] !== undefined) totalUmum += totalAkhirPerKategori[id];
    });

    // Final update ke DOM
    if (footerSubTotal) footerSubTotal.textContent = subTotalNilai
    if (footerAkhir) footerAkhir.textContent = totalAkhirNilai; // semua kategori
    // if (footerUmum) footerUmum.textContent = totalUmum;
    // if (footerUtama) footerUtama.textContent = totalUtama;

    // if (textUtama) textUtama.textContent = textUtamaVal + ')';
    // if (textUmum) textUmum.textContent = textUmumVal + ')';

    return 'ok';

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    throw error;
  }
}

async function validateToken() {
  let token = document.querySelector("#token-field").value; // Ambil nilai token dari input field

  openLoader();  // Show loader
  if (!token) {
    closeLoader();  // Close loader if token is empty
    return Swal.fire({
      title: "Error",
      text: "Token tidak boleh kosong!",
      icon: "error",
      confirmButtonText: "OK"
    });
  }

  // Membuat objek FormData
  let formData = new FormData();
  formData.append('token', token);  // Menambahkan token ke FormData

  try {
    // Mengirim request ke server untuk validasi token
    const response = await fetch('/validateTokenPeserta', {
      method: 'POST',
      body: formData // Mengirim formData berisi token
    });

    // Jika response tidak ok, tampilkan pesan error menggunakan Swal
    if (!response.ok) {
      const data = await response.json();
      console.error("Error response from server:", data.message);
      closeLoader();  // Close loader on error
      return Swal.fire({
        title: "Terjadi Kesalahan",
        text: "Kesalahan dari server: " + data.message,
        icon: "error",
        confirmButtonText: "OK"
      });
    }

    const data = await response.json();

    document.getElementById('peserta-title-field').textContent = data.data.no_peserta;
    document.getElementById('pangkalan-title-field').textContent = data.data.nama_pangkalan;
    await showSubPointPeserta(data.data.no_peserta);

    // Menyembunyikan semua elemen dengan kelas 'content-rekap' dan menampilkan 'rekap-lembar-peserta'
    document.querySelectorAll('.content-rekap').forEach(element => {
      element.classList.remove('show');
    });

    document.getElementById('rekap-lembar-peserta').classList.add('show');

    // Jika status sukses, tampilkan swal
    if (data.status === "success") {
      closeLoader();  // Close loader on success
      Swal.fire({
        title: "Success",
        text: `Token valid! No Peserta: ${data.data.no_peserta}`,
        icon: "success",
        confirmButtonText: "OK"
      });
    } else {
      closeLoader();  // Close loader on failure
      Swal.fire({
        title: "Error",
        text: "Token tidak valid!",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  } catch (error) {
    console.error("Error:", error);
    closeLoader();  // Close loader on error
    Swal.fire({
      title: "Terjadi Kesalahan",
      text: "Token tidak valid",
      icon: "error",
      confirmButtonText: "OK"
    });
  }
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

    noPeserta = document.getElementById('peserta-title-field').textContent
    pangkalanPeserta = document.getElementById('pangkalan-title-field').textContent

    wrapContentPrint.setAttribute('title-text', `Lembar Penilaian Labscoutition (${noPeserta} - ${pangkalanPeserta})`)
    wrapFormPrint.querySelector('#no-peserta-field').textContent = `: ${noPeserta}`
    wrapFormPrint.querySelector('#nama-pangkalan-field').textContent = `: ${pangkalanPeserta}`


    let { kategoriLomba, mataLomba } = await getData();
    document.querySelectorAll('.wrap-lembar-rekap').forEach(element => {
      // Men-clone elemen canvas
      const clonedCanvas = document.querySelector('#form-lembar-jawaban-temp .canvas-content').cloneNode(true);

      // Menambahkan elemen 'element' ke dalam clonedCanvas
      const contentElement = element.cloneNode(true);

      contentElement.querySelectorAll('.head-juri').forEach(element => {
        element.setAttribute('style', 'width:30px;');
      });
      // Check if the element exists before trying to remove it
      const headTitleElement = contentElement.querySelector('.head-title-lembar-rekap');
      if (headTitleElement) {
        headTitleElement.remove();
      }

      // Set styles for content elements
      const contentTableElement = contentElement.querySelector('.content-tb-lembar-rekap');
      if (contentTableElement) {
        contentTableElement.setAttribute('style', 'display: grid; grid-template-columns: 0.8fr 0.6fr; gap: 3px;');
      }

      const contentNilaiElement = contentElement.querySelector('.content-nilai-rekap-akhir');
      if (contentNilaiElement) {
        contentNilaiElement.setAttribute('style', 'display: grid; gap: 3px; grid-auto-rows: max-content;');
      }

      // contentElement.querySelectorAll('.td').forEach(element => {
      //   element.setAttribute('style', 'font-size:3px;');
      // });

      // Set text content for title
      const titleElement = clonedCanvas.querySelector('.title-lembar-jawaba-lomba');
      if (titleElement && element.querySelector('.head-title-lembar-rekap')) {
        titleElement.textContent = element.querySelector('.head-title-lembar-rekap').textContent;
      }

      // Append content to cloned canvas
      const contentWrapper = clonedCanvas.querySelector('#wrap-content-nilai-print');
      if (contentWrapper) {
        contentWrapper.appendChild(contentElement); // Clone element to add it into the wrapper
      }

      if (wrapContentPrint) {
        wrapContentPrint.appendChild(clonedCanvas);
      }
    });


    // CLONE CANVAS AND OPEN MODAL 

    openModal("#modal-content-lembar-jawaban-print")

    closeLoader()
  }

  if (act == 'print') {
    docName = document.querySelector('#wrap-content-print-preview').getAttribute('title-text')
    canvasWidth = 592 + 3
    canvasHeight = 837 + 3

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
          "font-size": "7px"
        },
        ".title-text": {
          "font-size": "10px",
          "font-weight": "bold"
        },
        ".check": {
          "background": "black",
          "color": "white"
        },
        ".title-check": {
          "font-size": "8px"
        },
        "th": {
          "background": "#444444",
          "text-align": "center",
          "font-weight": "bold",
          "color": "white"
        },
        ".col-juri": {
          "text-align": "center"
        },
        ".col-nilai, .col-footer-nilai, .col-total-akhir, .col-nilai-pinalti, .pengurangan-nilai-total, .pengurangan-nilai-field": {
          "text-align": "center"
        },
        ".col-footer-nilai-pinalti, .col-footer-nilai-umum, .col-footer-nilai-utama, .col-footer-nilai-akhir": {
          "text-align": "center",
          "font-weight": "800"
        },
        ".col-footer-nilai-pinalti": {
          "background": "#d62828",
          "color": "white"
        },
        ".col-footer-nilai-akhir": {
          "background": "#47bb8e",
          "color": "white"
        },
        ".col-footer-nilai-umum, .col-footer-nilai-sub-total": {
          "background": "#2200B8",
          "color": "white"
        },
        ".col-footer-nilai-utama": {
          "background": "#1e96fc",
          "color": "white"
        },
        ".category-header td": {
          "background": "#444444",
          "text-align": "center",
          "font-weight": "bold",
          "color": "white"
        },

        // Tambahan CSS
        ".tabel-rekap-nilai-lomba td, .tabel-rekap-nilai-lomba th, .tabel-rekap-pengurangan-nilai-lomba td, .tabel-rekap-pengurangan-nilai-lomba th, .tabel-rekap-akhir-nilai-lomba td, .tabel-rekap-akhir-nilai-lomba th": {
          "font-size": "7px",
          "padding": "2px"
        }
      }
    });


    closeLoader()
  }
}


async function loadContentFoto() {
  const noPeserta = document.querySelector('#peserta-title-field')?.textContent;
  const container = document.getElementById('foto-preview');

  if (!noPeserta || !container) {
    console.warn('❗ Data peserta/lomba atau container tidak ditemukan.');
    return;
  }

  const { mataLomba } = await getData();

  const formData = new FormData();
  formData.append('no_peserta', noPeserta);

  try {
    const response = await fetch('/loadFotoPenilaian', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    const fotoList = result.status === 'success' && Array.isArray(result.data) ? result.data : [];

    container.innerHTML = '';

    // Buat section untuk setiap mata lomba
    mataLomba.forEach(item => {
      const section = document.createElement('section');
      section.className = 'wrap-lembar-arsip';
      section.setAttribute('lomba-id', item.lomba_id);
      section.setAttribute('nama-lomba', item.nama_lomba);

      section.innerHTML = `
        <h3 class="head-title-lembar-rekap">LEMBAR C1 ${item.nama_lomba}</h3>
        <section class="wrap-conten-lembar-juri"></section>
      `;

      container.appendChild(section);
    });

    // Kelompokkan foto berdasarkan lomba_id
    const fotoByLomba = {};
    fotoList.forEach(item => {
      if (!fotoByLomba[item.lomba_id]) {
        fotoByLomba[item.lomba_id] = [];
      }
      fotoByLomba[item.lomba_id].push(item);
    });

    // Render konten per lomba
    mataLomba.forEach(item => {
      const target = document.querySelector(`.wrap-lembar-arsip[lomba-id="${item.lomba_id}"] .wrap-conten-lembar-juri`);
      const fotoLomba = fotoByLomba[item.lomba_id] || [];

      if (fotoLomba.length === 0) {
        target.innerHTML = `<p style="color:gray; font-size:14px;">❕ Belum ada lembar C1 untuk lomba ini.</p>`;
        return;
      }

      fotoLomba.forEach(foto => {
        const fileName = foto.file_path.split(/[\\/]/).at(-1);

        target.innerHTML += `
          <div class="wrap-img-preview" data-id="${foto.id}">
            <img src="${foto.file_path}" alt="Foto ${foto.no_peserta}">
            <div class="btn-img-preview">
              <a class="btn-download" href="${foto.file_path}" download="${fileName}" style="text-decoration: none;">
                <i class="bi bi-download"></i> Download
              </a>
            </div>
          </div>
        `;
      });
    });

  } catch (error) {
    console.error('❌ Gagal memuat foto penilaian:', error);
    container.innerHTML = '<p style="color:red">Gagal memuat data dari server.</p>';
  }
}


async function previewFotoPenilaian() {
  await loadContentFoto()
  openModal('#modal-lampiran-lembar-juri');
}
