// Modal dan fungsi umum
modals = ["#modal-update-nilai-lomba", "#modal-camera-scan-qrcode", "#modal-update-nilai-lomba-qr", "#modal-update-kategori-juara", '#modal-content-lembar-juara-print', '#modal-kuesioner', '#modal-upload-lembar-juri', '#modal-lampiran-lembar-juri', '#modal-content-report-juara-print'];
fillModalContent(modals);
aksesJuri = [
  { user: 'EP04', input_akses: 11 },
  { user: 'EP05', input_akses: 12 },
  { user: 'EP06', input_akses: 13 },
  { user: 'EP07', input_akses: 14 }
]

rekapBanding = [];
initApp()

async function initApp() {
  await loadRekapBandingData(); // <-- HARUS nunggu ini selesai
  setRekapNilai();
  generateSidebar();
  fectDataOption();
  createCategories();
}

if (userInfo.Group_position === "EP03") {
  const wrapLembar = document.getElementById('wrap-body-lembar-penilaian');
  const rekapContent = document.getElementById('rekap-content-section');
  const rekapJuara = document.getElementById('wrap-rekap-juara');
  const btnLembar = document.getElementById('btn-lembar-penilaian-rekap');
  const btnProgress = document.getElementById('btn-progress-rekap');
  const btnJuara = document.getElementById('btn-juara-rekap');
  openModal('#modal-kuesioner')
  // Hapus elemen jika ada
  if (btnLembar) btnLembar.remove();
  // if (btnProgress) btnProgress.remove();
  if (rekapContent) rekapContent.remove();
  if (wrapLembar) wrapLembar.remove();
  document.getElementById('btn-kategori-juara').remove()
  document.querySelector('#wrap-header-lembar-jawaban .wrap-setting-rekap').innerHTML += `<button onclick="openModal('#modal-kuesioner')" id="btn-kuesioner-rekap">Kuesioner</button>`
  // Tampilkan tombol juara
  if (btnJuara) btnJuara.classList.add('active');
  if (rekapJuara) rekapJuara.classList.add('show');
}


// Fungsi untuk mengambil semua data
async function getData() {
  const [kategoriLombaRes, mataLombaRes, nilaiLombaRes, pesertaRes] = await Promise.all([
    fetch('/loadKategoriLomba', {
      method: 'POST'
    }).then(res => res.json()),
    fetch('/loadLomba', {
      method: 'POST'
    }).then(res => res.json()),
    fetch('/loadNilaiLomba', {
      method: 'POST'
    }).then(res => res.json()),
    fetch('/loadPesertaList', {
      method: 'POST'
    }).then(res => res.json())
  ]);

  return {
    kategoriLomba: kategoriLombaRes.data ? Object.values(kategoriLombaRes.data) : [], // Jika data tidak ada, gunakan array kosong
    mataLomba: mataLombaRes.data ? Object.values(mataLombaRes.data) : [], // Jika data tidak ada, gunakan array kosong
    nilaiLomba: nilaiLombaRes.data ? Object.values(nilaiLombaRes.data) : [], // Jika data tidak ada, gunakan array kosong
    peserta: pesertaRes.data ? Object.values(pesertaRes.data) : [] // Jika data tidak ada, gunakan array kosong
  };
}

// // Fungsi untuk menyiapkan dan menampilkan rekap nilai
tipePenilaian = 'point';  // Menyederhanakan definisi tipePenilaian
reguPeserta = false;  // Atur reguPeserta sesuai kebutuhan
async function setRekapNilai() {
  let { kategoriLomba, mataLomba, peserta } = await getData();
  let { data: kategoripenilaianLists } = await fetch('/loadKategoriPenilaianAll', { method: 'POST' }).then(res => res.json());

  const pesertaField = document.getElementById('opt-filter-peserta-field');
  const kategoriField = document.getElementById('opt-filter-kategori-field');
  const mataLombaField = document.getElementById('opt-filter-mata-lomba-field');

  const optionPeserta = pesertaField?.value || null;
  const optionKategoriLomba = kategoriField?.value || null;
  const optionMataLomba = mataLombaField?.value || null;

  if (optionPeserta) {
    peserta = peserta.filter(p => p.no_peserta === optionPeserta);
  }

  if (optionMataLomba) {
    const id = Number(optionMataLomba);
    mataLomba = mataLomba.filter(m => m.lomba_id === id);
    kategoripenilaianLists = kategoripenilaianLists.filter(k => k.lomba_id === id);
  }

  if (optionKategoriLomba) {
    const id = Number(optionKategoriLomba);
    kategoriLomba = kategoriLomba.filter(k => k.kategori_id === id);
  }

  const kategoriMap = kategoriLomba.reduce((map, kat) => {
    map[kat.kategori_id] = { nama: kat.nama_kategori, lomba: [] };
    return map;
  }, {});
  mataLomba.forEach(lomba => kategoriMap[lomba.kategori_id]?.lomba.push(lomba));

  const thead = document.querySelector("#tabel-rekap-nilai-lomba thead");
  const tbody = document.querySelector("#tabel-rekap-nilai-lomba tbody");

  // === Build header ===
  let headerKategori = `
    <tr>
      <th class="col-no" rowspan="3">No</th>
      <th class="col-no-peserta" rowspan="3">No Peserta</th>
      <th class="col-nama-pangkalan" rowspan="3">Nama Pangkalan</th>
  `;
  if (reguPeserta) headerKategori += `<th class="col-regu" rowspan="3">Regu</th>`;

  let headerLomba = "<tr>";
  Object.values(kategoriMap).forEach(kat => {
    const totalColspan = kat.lomba.reduce((sum, lomba) => {
      return sum + kategoripenilaianLists.filter(k => k.lomba_id === lomba.lomba_id).length + 1;
    }, 0);
    headerKategori += `<th colspan="${totalColspan}">${kat.nama}</th>`;
    kat.lomba.forEach(lomba => {
      const items = kategoripenilaianLists.filter(k => k.lomba_id === lomba.lomba_id);
      headerLomba += `<th colspan="${items.length + 1}" lomba-id="${lomba.lomba_id}">${lomba.nama_lomba}</th>`;
    });
  });

  headerKategori += `
    <th class="head-sub-total" rowspan="3">Sub Total</th>
    <th class="head-nili-pinalti-total" rowspan="3">Total Nilai Pinalti</th>
    <th class="head-total-akhir" rowspan="3">Total Akhir</th>
  `;
  headerLomba += "</tr><tr>";

  mataLomba.forEach(lomba => {
    const kategoriFilter = kategoripenilaianLists.filter(k => k.lomba_id === lomba.lomba_id);
    kategoriFilter.forEach(item => {
      headerLomba += `<th lomba-id="${lomba.lomba_id}" class="col-kategori-${item.nama_kategori.toLowerCase().replace(/\s+/g, '-')}">Total ${item.nama_kategori}</th>`;
    });
    headerLomba += `<th class="col-nilai-pinalti-${lomba.nama_lomba.toLowerCase().replace(/\s+/g, '-')}">Nilai Pinalti ${lomba.nama_lomba}</th>`;
  });
  headerLomba += "</tr>";

  if (thead) thead.innerHTML = headerKategori + headerLomba;

  // === Build tbody ===
  peserta.sort((a, b) => a.no_peserta.localeCompare(b.no_peserta));

  if (tbody) {
    tbody.innerHTML = peserta.length === 0
      ? `<tr><td colspan="100%">Belum ada data peserta</td></tr>`
      : peserta.map((peserta, idx) => {
        let row = `<tr>
          <td class="col-no">${idx + 1}</td>
          <td class="col-no-peserta">${peserta.no_peserta}</td>
          <td class="col-nama-pangkalan">${peserta.nama_pangkalan}</td>`;
        if (reguPeserta) row += `<td>${peserta.regu}</td>`;

        mataLomba.forEach(lomba => {
          const kategoriFilter = kategoripenilaianLists.filter(k => k.lomba_id === lomba.lomba_id);
          kategoriFilter.forEach(item => {
            row += `<td kategori-id="${item.kategori_id}" lomba-id="${item.lomba_id}" peserta-no="${peserta.no_peserta}" class="col-kategori-penilaian tidak-ikut-lomba"><i title="Tidak Mengikuti" class="bi bi-x-circle-fill"></i></td>`;
          });
          row += `<td lomba-id="${lomba.lomba_id}" peserta-no="${peserta.no_peserta}" class="col-nilai-pinalti-lomba">0</td>`;
        });

        row += `
          <td class="col-sub-total" peserta-no="${peserta.no_peserta}">0</td>
          <td class="col-nilai-pinalti" peserta-no="${peserta.no_peserta}">0</td>
          <td class="col-total-akhir" peserta-no="${peserta.no_peserta}">0</td>
        </tr>`;
        return row;
      }).join('');
  }

  // === Cleanup & Class Assignment ===
  peserta.forEach(peserta => {
    peserta.mata_lomba.forEach(lomba => {
      document.querySelectorAll(`.col-kategori-penilaian[lomba-id="${lomba.lomba_id}"][peserta-no="${peserta.no_peserta}"]`).forEach(element => {
        element.classList.remove('tidak-ikut-lomba', 'nilai-belum-diberikan', 'nilai-diisi');
        const isi = element.textContent.trim();
        const hasIcon = element.querySelector('.bi-question-circle-fill');
        const isNumber = isi && !isNaN(isi);

        if (isNumber && !hasIcon) {
          element.classList.add('nilai-diisi');
        } else {
          element.innerHTML = `<i title="Nilai Belum Dimasukan" class="bi bi-question-circle-fill"></i>`;
          element.classList.add('nilai-belum-diberikan');
        }
      });
    });
  });

  await setResultRekapProgress();
}



async function setRekapJuara(dataLomba, kategorPenilaian) {
  let { kategoriLomba, mataLomba, peserta } = await getData();
  let { data: kategoripenilaianLists } = await fetch('/loadKategoriPenilaianAll', { method: 'POST' }).then(res => res.json());

  // 1. Struktur Data untuk Mempermudah Akses
  const kategoriMap = kategoriLomba.reduce((map, kat) => {
    map[kat.kategori_id] = { nama: kat.nama_kategori, lomba: [] };
    return map;
  }, {});

  mataLomba.forEach(lomba => kategoriMap[lomba.kategori_id]?.lomba.push(lomba));

  // 2. Generate Header Tabel
  const thead = document.querySelector("#tabel-rekap-juara-lomba thead");
  const tbody = document.querySelector("#tabel-rekap-juara-lomba tbody");

  const kategoriJuaraId = document.querySelector('#kategori-juara-list-menu .kategori-juara-header.active').getAttribute('kategori-juara-id')
  datarekapBanding = rekapBanding.find(item => item.kategori_juara_id === Number(kategoriJuaraId));
  idPointBanding = datarekapBanding.value_banding;
  lombaId = idPointBanding
  if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'point' || datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'umum') {
    lomba = mataLomba.find(item => item.lomba_id === lombaId);
    namaLomba = lomba ? lomba.nama_lomba : "";
    filteredData = kategoripenilaianLists.filter(item => item.lomba_id === lombaId);
  } else if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'point' || datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'utama') {
    lomba = mataLomba.find(item => item.lomba_id === lombaId);
    namaLomba = lomba ? lomba.nama_lomba : "";
    filteredData = kategoripenilaianLists.filter(item => item.lomba_id === lombaId);
  } else if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'kategori') {
    filteredData = kategoripenilaianLists.filter(item => item.lomba_id === lombaId && item.nilai_banding === 'active');
    namaKategori = filteredData.map(item => item.nama_kategori);
    namaLomba = filteredData.map(item => item.nama_kategori).join(', ') || '';
  } else {
    namaLomba = ''
  }


  let headerKategori = "<tr><th rowspan='3'>No</th><th rowspan='3'>No Peserta</th><th rowspan='3'>Nama Pangkalan</th>";
  if (reguPeserta) headerKategori += `<th rowspan='3'>Regu</th>`;

  if (datarekapBanding.akumulasi_rekap_nilai == 'nilai') {

    colspanX = 1
  } else {
    colspanX = 3 * dataLomba.length;
  }

  let headerLomba = "<tr>";
  Object.values(kategoriMap).forEach(kat => {
    headerKategori += `<th class="head-kategori-lomba" colspan="${colspanX}">${kat.nama}</th>`;
  });

  if (datarekapBanding.tipe_penilaian_lomba == 'kategori') {
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'point') {
      headerKategori += `<th rowspan='3'>Rank</th> <th rowspan='3'>Point Banding ${namaLomba}</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'utama') {
      headerKategori += `<th rowspan='3'>Rank</th> <th rowspan='3'>Nilai Banding</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'umum') {
      // headerKategori += `<th rowspan='3'>Rank</th> <th rowspan='3'>Nilai Banding ${namaLomba} Umum</th>`;
      headerKategori += `<th rowspan='3'>Rank</th> <th rowspan='3'>Nilai Banding ${namaLomba}</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'utama') {
      headerKategori += `<th rowspan='3'>Rank</th> <th rowspan='3'>Nilai Banding ${namaLomba} Utama</th>`;
    }
  }

  if (datarekapBanding.tipe_penilaian_lomba == 'mata lomba') {
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'point') {
      headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Rank</th> <th rowspan='3'>Point Banding ${namaLomba}</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'utama') {
      headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Rank</th> <th rowspan='3'>Nilai Banding ${namaLomba} Utama</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'kategori') {
      headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Rank</th> <th rowspan='3'>Nilai Banding ${namaLomba}</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'umum') {
      if (filteredData.length > 1) {
        // headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Rank</th> <th rowspan='3'>Nilai Banding ${namaLomba} Umum</th>`;
        headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Rank</th> <th rowspan='3'>Nilai Banding ${namaLomba}</th>`;
      }
      if (filteredData.length == 1) {
        headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Rank</th> <th rowspan='3'>Nilai Banding ${namaLomba} </th>`;
      }
    }
    if (datarekapBanding.set_value_banding == false && datarekapBanding.akumulasi_rekap_nilai == 'point') {
      headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Rank</th>`;
    }
    if (datarekapBanding.set_value_banding == false && datarekapBanding.rakap_banding == 'utama' || datarekapBanding.set_value_banding == false && datarekapBanding.rakap_banding == 'umum') {
      headerKategori += ` <th rowspan='3'>Rank</th>`;
    }

  }

  if (datarekapBanding.akumulasi_rekap_nilai == 'nilai') {
    colspan = 'colspan="1"'
  } else {
    colspan = 'colspan="3"'
  }

  if (datarekapBanding.tipe_penilaian_lomba === 'kategori') {
    dataLomba.forEach(lomba => {
      headerLomba += `<th ${colspan} lomba-id="${lomba.lomba_id}">Kategori (`;

      // Loop through the kategorPenilaian array to build category names
      kategorPenilaian.forEach((item, index) => {
        headerLomba += item.nama_kategori_penilaian;

        // Add the plus sign if it's not the last item
        if (index < kategorPenilaian.length - 1) {
          headerLomba += ' + ';
        }
      });

      headerLomba += `)</th>`;
    });
  }

  if (datarekapBanding.tipe_penilaian_lomba == 'mata lomba') {
    dataLomba.forEach(lomba => {
      headerLomba += `<th ${colspan} lomba-id="${lomba.lomba_id}">${lomba.nama_lomba}</th>`;
    });
  }


  if (datarekapBanding.akumulasi_rekap_nilai == 'nilai') {
    colspan = 'colspan="1"';
    headerLomba += `<tr>`
    dataLomba.forEach(lomba => {
      headerLomba += `<th>Nilai</th>`;
    });
  } else {
    headerLomba += `<tr>`
    dataLomba.forEach(lomba => {
      headerLomba += `<th>Nilai</th><th>Rank</th><th>Point</th>`;
    });
    colspan = 'colspan="3"';
  }


  thead.innerHTML = headerKategori + headerLomba;

  // 3. Urutkan dan Tentukan Rank Peserta
  peserta.sort((a, b) => a.no_peserta.localeCompare(b.no_peserta));

  setNilaiRekapJuara(kategoripenilaianLists, dataLomba, kategorPenilaian)
}

async function setNilaiRekapJuara(kategoripenilaianLists, dataLomba, kategorPenilaianJuara) {
  try {
    let { peserta } = await getData();
    const [rekapData, penguranganData] = await Promise.all([
      fetch('/loadNilaiRekap', { method: 'POST' }).then(res => res.json()).then(data => data.data || []),
      fetch('/loadPointPenguranganPeserta', { method: 'POST' }).then(res => res.json()).then(data => data.data || [])
    ]);

    // Jika kategoripenilaianLists kosong, beri array kosong sebagai fallback
    const categories = kategoripenilaianLists || [];
    const result = {};

    // Langkah 2: Memproses nilai dan mengategorikannya
    if (rekapData.length > 0) {
      rekapData.forEach(score => {
        const category = categories.find(cat => cat.kategori_id == score.kategori_penilaian_id);

        // console.log('score', score)
        if (category) {
          // Jika peserta belum ada dalam hasil, buat entri untuknya
          // console.log('category', category)
          if (!result[score.no_peserta]) {
            result[score.no_peserta] = {};
          }

          // Jika kategori lomba belum ada dalam hasil peserta, buat entri kategori
          if (!result[score.no_peserta][category.nama_kategori]) {
            result[score.no_peserta][category.nama_kategori] = {
              kategori_id: category.kategori_id,
              lomba_id: category.lomba_id,
              nilai_juri: 0,
              pengurangan_poin: 0,
              total_nilai: 0,
              set_nilai: category.set_nilai,
              nilai_banding: score.nilai_banding
            };
          }

          // Menambahkan nilai juri ke kategori yang sesuai
          result[score.no_peserta][category.nama_kategori].nilai_juri += score.total_nilai_juri;
        }
      });
    }
    // Langkah 3: Menerapkan penalti
    if (penguranganData.length > 0) {
      penguranganData.forEach(penalty => {
        const category = categories.find(cat => cat.kategori_id == penalty.kategori_id);

        if (category) {
          // Jika peserta dan kategori ada, kurangi nilai berdasarkan penalti
          if (result[penalty.no_peserta] && result[penalty.no_peserta][category.nama_kategori]) {
            result[penalty.no_peserta][category.nama_kategori].pengurangan_poin += penalty.point_pengurangan;
          }
        }
      });
    }

    // Langkah 4: Menghitung total nilai setelah penalti
    Object.keys(result).forEach(noPeserta => {
      Object.keys(result[noPeserta]).forEach(kategori => {
        const category = result[noPeserta][kategori];
        // Total nilai = nilai juri - pengurangan poin
        category.total_nilai = category.nilai_juri - category.pengurangan_poin;
      });
    });

    // Menampilkan hasil akhir dengan lomba_id
    kategoriJuaraId = document.querySelector('#kategori-juara-list-menu .kategori-juara-header.active').getAttribute('kategori-juara-id');
    totalNilaiKategori = result;
    
    generalPinalti = calculateGeneralPinalti(penguranganData)
    hasil2 = akumulasiNilaiDenganBanding(totalNilaiKategori, kategorPenilaianJuara, kategoriJuaraId, 'mainRekap', generalPinalti);
    dataRankLombaPoint = processAndRankPeserta(totalNilaiKategori, masterRank, generalPinalti);
    hasilAkumulasi = accumulatePoints(hasil2, dataRankLombaPoint, kategoriJuaraId, 'mainRekap');
    
    resultRekapPoint = {};
    hasilAkumulasi.forEach(peserta => {
      resultRekapPoint[peserta.no_peserta] = {
        total_point: peserta.total_point,
        point_banding: peserta.point_banding,
        total_nilai_lomba: peserta.total_nilai_lomba,
        no_peserta: peserta.no_peserta,
        rekap_lomba: peserta.rekap_lomba,
        rank: peserta.rank
      };
    });

    let sortedRekapaJuaraPeserta = Object.entries(resultRekapPoint).map(([id, data]) => ({ id, ...data }));

    // Sort the array by 'rank'
    sortedRekapaJuaraPeserta.sort((a, b) => {
      if (a.rank == null && b.rank == null) return 0
      if (a.rank == null) return 1  // a di akhir
      if (b.rank == null) return -1 // b di akhir
      return a.rank - b.rank
    })

    // Mengecek jika sortedRekapaJuaraPeserta kosong, tampilkan pesan bahwa tidak ada data peserta
    if (sortedRekapaJuaraPeserta.length === 0) {
      document.querySelector('#tabel-rekap-juara-lomba tbody').innerHTML = `<tr><td colspan="100%">Belum ada data peserta</td></tr>`;
    } else {
      let no = 0; // Inisialisasi nomor peserta
      let rekapRow = ''; // Inisialisasi row tabel

      // Mendapatkan kategoriJuaraId dari elemen aktif
      const kategoriJuaraElement = document.querySelector('#kategori-juara-list-menu .kategori-juara-header.active');
      const kategoriJuaraId = kategoriJuaraElement ? kategoriJuaraElement.getAttribute('kategori-juara-id') : null;

      // Jika kategoriJuaraId tidak ditemukan, tampilkan error di console
      if (!kategoriJuaraId) {
        console.error('kategoriJuaraId tidak ditemukan atau tidak terdefinisi');
      }

      // Mencari set rekapBanding untuk kategoriJuaraId yang diberikan
      const rekapBandingSet = rekapBanding.find(item => item.kategori_juara_id === Number(kategoriJuaraId));

      // Loop untuk setiap peserta dalam sortedRekapaJuaraPeserta
      sortedRekapaJuaraPeserta.forEach(details => {
        // Lewati peserta dengan total_nilai_lomba nol
        // if (details.total_nilai_lomba === 0) {
        //   return;
        // }

        no++;
        let noPeserta = details.no_peserta;
        let namaPangkalan = peserta.find(item => item.no_peserta === noPeserta)?.nama_pangkalan || null;

        // Inisialisasi baris untuk setiap peserta
        let row = `<tr class="rank-${details.rank}"><td>${no}</td><td class="col-no-peserta">${noPeserta}</td><td class="col-pangkalan">${namaPangkalan}</td>`;

        // Tambahkan sel kosong untuk "reguPeserta" jika berlaku
        if (reguPeserta) row += `<td></td>`;

        // Loop melalui dataLomba dan tambahkan detail ke dalam baris
        dataLomba.forEach(lomba => {
          const lombaDetails = details.rekap_lomba.find(l => l.lomba_id === lomba.lomba_id);
          let nilai = '';
          let rank = '';
          let point = '';

          if (lombaDetails) {
            if (rekapBandingSet?.set_value_banding === false) {
              nilai = lombaDetails.total_nilai || 0;
            } else if (rekapBandingSet?.rakap_banding === 'point') {
              nilai = lombaDetails.total_nilai || 0;
              if (lombaDetails.total_nilai != 0 && lombaDetails.nilai_banding_kategori == 0) nilai = lombaDetails.total_nilai || '';
            } else if (rekapBandingSet?.rakap_banding === 'nilai' || rekapBandingSet?.rakap_banding === 'umum' || rekapBandingSet?.rakap_banding === 'kategori') {
              nilai = lombaDetails.total_nilai || 0;
            }

            rank = lombaDetails.rank || '';
            point = lombaDetails.points || '';
            totalNilaiLomba = lombaDetails.total_nilai || 0;

            // Tambahkan sel untuk nilai, rank, dan points
            if (rekapBandingSet?.akumulasi_rekap_nilai === 'nilai') {
              row += `<td class="rekap-nilai-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}">${totalNilaiLomba}</td>`;
            } else {
              row += `
            <td class="rank-${rank} rekap-nilai-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}">${nilai}</td>
            <td class="rank-${rank} rekap-rank-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}">${rank}</td>
            <td class="rank-${rank} rekap-point-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}">${point}</td>
          `;
            }
          } else {
            // Jika lombaDetails tidak ditemukan, tambahkan sel kosong
            row += `
          <td class="rekap-nilai-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}"></td>
          <td class="rekap-rank-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}"></td>
          <td class="rekap-point-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}"></td>
        `;
          }
        });

        // Set nilaiBanding berdasarkan konfigurasi rekapBanding
        let nilaiBanding = '';
        if (rekapBandingSet?.rakap_banding === 'point') {
          nilaiBanding = details.point_banding || '';
        } else if (rekapBandingSet?.rakap_banding === 'nilai' || rekapBandingSet?.rakap_banding === 'umum' || rekapBandingSet?.rakap_banding === 'kategori') {
          // Akses nilai_banding_kategori dengan benar dari rekap_lomba
          nilaiBanding = details.rekap_lomba?.[0]?.nilai_banding_kategori || ''; // Perbaikan di sini
        }

        // Tambahkan kolom untuk total_rank_points, point_banding, dan rank_juara
        if (datarekapBanding.tipe_penilaian_lomba == 'mata lomba') {
          if (datarekapBanding.set_value_banding == false) {
            row += `
            <td class="rank-utama${details.rank} rekap-total-rank-points">${details.total_point || ''}</td>
            <td class="rank-utama${details.rank} rekap-overall-rank-juara">${details.rank || ''}</td>
        `;
          } else if (datarekapBanding.set_value_banding == true) {
            row += `
            <td class="rank-utama${details.rank} rekap-total-rank-points">${details.total_point || ''}</td>
            <td class="rank-utama${details.rank} rekap-overall-rank-juara">${details.rank || ''}</td>
            <td class="rank-utama${details.rank} rekap-total-points-banding">${nilaiBanding}</td>
        `;
          }
        }

        if (datarekapBanding.tipe_penilaian_lomba == 'kategori') {
          if (datarekapBanding.set_value_banding == false) {
            row += `
            <td class="rank-utama${details.rank} rekap-overall-rank-juara">${details.rank || ''}</td>
        `;
          } else if (datarekapBanding.set_value_banding == true) {
            row += `
            <td class="rank-utama${details.rank} rekap-overall-rank-juara">${details.rank || ''}</td>
            <td class="rank-utama${details.rank} rekap-total-points-banding">${nilaiBanding || ''}</td>
        `;
          }
        }

        // Tutup baris dan tambahkan ke rekapRow
        row += `</tr>`;
        rekapRow += row;
      });

      // Masukkan semua baris ke dalam badan tabel
      document.querySelector('#tabel-rekap-juara-lomba tbody').innerHTML = rekapRow;
      ketegoriJuaraText = document.querySelector('.kategori-juara-header.active span').textContent
      const totalJuara = kategorPenilaianJuara[0].total_juara;
      document.getElementById('header-total-juara').textContent = totalJuara;
      document.getElementById('header-kategori-juara').textContent = ketegoriJuaraText
      // Tambahkan kelas 'main-rank' pada peringkat teratas
      for (let index = 0; index < totalJuara; index++) {
        const rowRanks = document.querySelectorAll(`#tabel-rekap-juara-lomba tr.rank-${index + 1}`);
        rowRanks.forEach(row => {
          row.classList.add('main-rank');
          row.querySelector('.rekap-overall-rank-juara').innerHTML += '<span>🏆</span>';
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Terjadi kesalahan saat memproses data rekap juara.');
  }
}


function calculateGeneralPinalti(dataList) {
  // Filter data yang memiliki kategori_id = "0"
  const generalCategory = dataList.filter(item => item.kategori_id === "0");

  const result = [];

  // Loop setiap data pada kategori umum
  generalCategory.forEach(item => {
    // Cek apakah kombinasi no_peserta dan lomba_id sudah ada di hasil
    const existing = result.find(entry =>
      entry.no_peserta === item.no_peserta && entry.lomba_id === item.lomba_id
    );

    if (existing) {
      // Jika sudah ada, tambahkan point_pengurangan ke total
      existing.total_pinalti_general += item.point_pengurangan;
    } else {
      // Jika belum ada, buat entri baru
      result.push({
        no_peserta: item.no_peserta,
        lomba_id: item.lomba_id,
        total_pinalti_general: item.point_pengurangan
      });
    }
  });

  return result;
}

function filterByKategoriJuaraId(kategoriId) {
  const result = rekapBanding.filter(item => item.kategori_juara_id === kategoriId);

  // If no data is found, return an empty array
  return result.length > 0 ? result : [];
}
// Fungsi untuk mengakumulasi nilai berdasarkan kategori_id dan kategori_penilaian_id
function akumulasiNilaiDenganBanding(data, kategorPenilaianJuara, kategoriJuaraId, type, generalPinalti) {
  dataRankLombaPoint = processAndRankPeserta(data, masterRank, generalPinalti);
  kategoriPenilaianValid = kategorPenilaianJuara;
  const akumulasiNilai = {};
  if (type == 'mainRekap') {
    kategoriJuaraId = document.querySelector('#kategori-juara-list-menu .kategori-juara-header.active').getAttribute('kategori-juara-id');
  }
  datarekapBanding = rekapBanding.find(item => item.kategori_juara_id === Number(kategoriJuaraId));
  for (const peserta in data) {
    for (const lomba in data[peserta]) {
      let lombaData = data[peserta][lomba];
      let lombaId = lombaData.lomba_id;
      let kategoriId = lombaData.kategori_id;
      let totalNilai = lombaData.total_nilai;
      let nilaiBanding = lombaData.nilai_banding;
      let noPeserta = peserta;
      let points = dataRankLombaPoint[lombaId]?.find(item => item.peserta === peserta)?.points || 0;
      let rank = dataRankLombaPoint[lombaId]?.find(item => item.peserta === peserta)?.rank || 0;
      let keteranganJuara = dataRankLombaPoint[lombaId]?.find(item => item.peserta === peserta)?.keterangan || '-';
      let status = dataRankLombaPoint[lombaId]?.find(item => item.peserta === peserta)?.status || '-';
      let foundGeneralDeduction = generalPinalti.find(item => item.no_peserta === noPeserta && item.lomba_id === lombaId);
      let totalGeneralPinalti = foundGeneralDeduction ? foundGeneralDeduction.total_pinalti_general : 0;

      const validKategori = kategoriPenilaianValid.find(item => {
        return item.lomba_id === String(lombaId) && item.kategori_penilaian_id === String(kategoriId);
      });
      if (!validKategori) {
        continue;
      }
      if (!akumulasiNilai[lombaId]) {
        akumulasiNilai[lombaId] = [];
      }

      const pesertaLama = akumulasiNilai[lombaId].find(item => item.no_peserta === noPeserta);
      if (pesertaLama) {
        if (lombaData.set_nilai == 'active' || lombaData.set_nilai == 'umum'){
          pesertaLama.total_nilai += totalNilai;
        }

        if (nilaiBanding === "active") {
          pesertaLama.nilai_active += totalNilai;
          pesertaLama.nilai_banding_kategori += totalNilai; // update juga
        }
      } else {
        const nilaiActive = (nilaiBanding === "active") ? totalNilai : 0;
        akumulasiNilai[lombaId].push({
          no_peserta: noPeserta,
          sub_total_nilai: totalNilai,
          total_nilai: totalNilai - totalGeneralPinalti,
          nilai_active: nilaiActive,         // tetap ada
          nilai_banding_kategori: nilaiActive, // juga tetap ada
          total_pinalti_general: totalGeneralPinalti, // juga tetap ada
          lomba_id: lombaId,
          point: points,
          rank: rank,
          keterengan: keteranganJuara,
          status: status,
        });
      }
    }
  }

  const finalResult = {};

  for (const lombaId in akumulasiNilai) {
    finalResult[lombaId] = akumulasiNilai[lombaId];
  }
  return finalResult;
}

function accumulatePoints(dataLomba, dataRankLombaPoint, kategoriJuaraId, type) {
  const pesertaMap = {};
  // Ambil kategoriJuaraId sekali saja
  if (type == 'mainRekap') {
    kategoriJuaraId = document.querySelector('#kategori-juara-list-menu .kategori-juara-header.active').getAttribute('kategori-juara-id');
  }

  // Ambil datarekapBanding sesuai kategoriJuaraId
  const datarekapBanding = rekapBanding.find(item => item.kategori_juara_id === Number(kategoriJuaraId));
  for (const lombaId in dataLomba) {
    dataLomba[lombaId].forEach(lomba => {
      const { no_peserta, point, rank, total_nilai, status, nilai_banding_kategori } = lomba;

      // Inisialisasi peserta jika belum ada di pesertaMap
      if (!pesertaMap[no_peserta]) {
        pesertaMap[no_peserta] = {
          total_point: 0,
          point_banding: 0,  // Point banding dimulai dengan 0
          no_peserta: no_peserta,
          rekap_lomba: [],
          rank: 0,
          total_nilai_lomba: 0 // Inisialisasi total_nilai_lomba
        };
      }

      // Tentukan nilai point_banding jika set_value_banding true, jika tidak 0
      let point_banding = 0;
      if (datarekapBanding.set_value_banding === true && datarekapBanding.rakap_banding === 'point') {
        point_banding = dataRankLombaPoint[idPointBanding]?.find(item => item.peserta === no_peserta)?.points || 0;
      }
      nilaiBandingKategori = nilai_banding_kategori
      if (datarekapBanding.set_value_banding === true && datarekapBanding.rakap_banding === 'umum') {
        nilaiBandingKategori = dataRankLombaPoint[idPointBanding]?.find(item => item.peserta === no_peserta)?.total_nilai_lomba || 0;
      }

      // Akumulasi poin lomba
      pesertaMap[no_peserta].total_point += point;
      pesertaMap[no_peserta].total_nilai_lomba += total_nilai; // Akumulasi total nilai lomba

      // Menambahkan rekap lomba untuk setiap peserta
      pesertaMap[no_peserta].rekap_lomba.push({
        lomba_id: lombaId,
        total_nilai: total_nilai,
        nilai_banding_kategori: nilaiBandingKategori,  // Menambahkan nilai_banding_kategori
        rank: rank,
        points: point,
        kategori_id: lombaId, // Menambahkan lomba_id sebagai kategori_id
        draw_status: status === "Draw"  // Menambahkan status Draw
      });

      // Mengupdate nilai point_banding hanya sekali per peserta
      pesertaMap[no_peserta].point_banding = point_banding;
    });
  }
  let sortedPeserta = [];

  // Sorting berdasarkan berbagai kondisi kombinasi akumulasi dan rakap_banding
  // if (datarekapBanding.akumulasi_rekap_nilai === 'point') {
  //   // Urutkan berdasarkan total_point lalu point_banding
  //   sortedPeserta = Object.values(pesertaMap).sort((a, b) => {
  //     if (b.total_point === a.total_point) {
  //       return b.point_banding - a.point_banding;
  //     }
  //     return b.total_point - a.total_point;
  //   });
  // }

  // if (
  //   datarekapBanding.rakap_banding === 'point' &&
  //   datarekapBanding.akumulasi_rekap_nilai === 'nilai'
  // ) {
  //   // Urutkan berdasarkan total_nilai_lomba lalu point_banding
  //   sortedPeserta = Object.values(pesertaMap).sort((a, b) => {
  //     if (b.total_nilai_lomba === a.total_nilai_lomba) {
  //       return b.point_banding - a.point_banding;
  //     }
  //     return b.total_nilai_lomba - a.total_nilai_lomba;
  //   });
  // }

  console.log('datarekapBanding', datarekapBanding)
  if (
    (datarekapBanding.rakap_banding === 'nilai' || datarekapBanding.rakap_banding === 'umum') &&
    datarekapBanding.akumulasi_rekap_nilai === 'nilai'
  ) {
    // Urutkan berdasarkan total_nilai_lomba lalu nilai_banding_kategori
    sortedPeserta = Object.values(pesertaMap).sort((a, b) => {
      if (b.total_nilai_lomba === a.total_nilai_lomba) {
        const bNilai = b.rekap_lomba?.[0]?.nilai_banding_kategori || 0;
        const aNilai = a.rekap_lomba?.[0]?.nilai_banding_kategori || 0;
        return bNilai - aNilai;
      }
      return b.total_nilai_lomba - a.total_nilai_lomba;
    });
  }
  if (
    datarekapBanding.tipe_penilaian_lomba === 'mata lomba' &&
    datarekapBanding.akumulasi_rekap_nilai === 'point' &&
    datarekapBanding.rakap_banding === 'umum'
  ) {
    const lombaIdTarget ='11'

    console.log('datarekapBanding', datarekapBanding);

    sortedPeserta = Object.values(pesertaMap).sort((a, b) => {
      const aPoint = Number(a.total_point) || 0;
      const bPoint = Number(b.total_point) || 0;

      const aBanding = a.rekap_lomba?.find(r => r.lomba_id === lombaIdTarget)?.nilai_banding_kategori || 0;
      const bBanding = b.rekap_lomba?.find(r => r.lomba_id === lombaIdTarget)?.nilai_banding_kategori || 0;

      // 1. Urut berdasarkan total_point DESC
      if (aPoint !== bPoint) return bPoint - aPoint;

      // 2. Jika point sama, urut berdasarkan nilai_banding_kategori DESC
      return bBanding - aBanding;
    });
  }



  if (
    datarekapBanding.tipe_penilaian_lomba === 'mata lomba' &&
    datarekapBanding.akumulasi_rekap_nilai === 'point' &&
    datarekapBanding.rakap_banding === 'none'
  ) {
    sortedPeserta = Object.values(pesertaMap).sort((a, b) => {
      if (b.total_point !== 0 && a.total_point !== 0) {
        return b.total_point - a.total_point;
      } else if (b.total_point === 0 && a.total_point === 0) {
        return b.total_nilai_lomba - a.total_nilai_lomba;
      } else if (b.total_point === 0) {
        return -1;
      } else {
        return 1;
      }
    });
  } else if (
    datarekapBanding.tipe_penilaian_lomba === 'mata lomba' &&
    datarekapBanding.akumulasi_rekap_nilai === 'point' &&
    datarekapBanding.rakap_banding === 'kategori'
  ) {
    sortedPeserta = Object.values(pesertaMap).sort((a, b) => {
      if (b.total_point !== 0 && a.total_point !== 0) {
        return b.total_point - a.total_point;
      }

      if (b.total_point === 0 && a.total_point === 0) {
        if (b.total_nilai_lomba !== a.total_nilai_lomba) {
          return b.total_nilai_lomba - a.total_nilai_lomba;
        }

        const bNilai = b.rekap_lomba?.[0]?.nilai_banding_kategori || 0;
        const aNilai = a.rekap_lomba?.[0]?.nilai_banding_kategori || 0;
        return bNilai - aNilai;
      }

      return b.total_point === 0 ? -1 : 1;
    });
  }

  console.log('sortedPeserta', sortedPeserta)
  let currentRank = 1;
  let lastRank = 1;
  let lastTotalPoint = -1;
  let lastDrawStatus = false;
  let lastPointBanding = -1;

  
  sortedPeserta.forEach((peserta, index) => {
    if (peserta.total_nilai_lomba === 0 && peserta.total_point === 0) {
      peserta.rank = null;
      return;
    }

    const isDraw = peserta.rekap_lomba?.[0]?.draw_status === true;
    const pointBanding = peserta.point_banding || peserta.rekap_lomba?.[0]?.nilai_banding_kategori || 0;

    const sameAsLast =
      peserta.total_point === lastTotalPoint &&
      isDraw &&
      lastDrawStatus &&
      pointBanding === lastPointBanding &&
      pointBanding === 0;

    if (sameAsLast) {
      peserta.rank = lastRank;
    } else {
      peserta.rank = currentRank;
      lastRank = currentRank;
    }

    lastTotalPoint = peserta.total_point;
    lastDrawStatus = isDraw;
    lastPointBanding = pointBanding;
    currentRank++;
  });
  // Kembalikan hasil akhir
  return sortedPeserta;
}

function processAndRankPeserta(data, masterRank, generalPinalti) {
  const pesertaMap = {}
  const lombaRankingMap = {}

  // Langkah 1: Akumulasi nilai untuk setiap peserta dan lomba
  for (const peserta in data) {
    for (const lomba in data[peserta]) {
      const {
        lomba_id,
        nilai_juri,
        total_nilai,
        set_nilai,
        nilai_banding
      } = data[peserta][lomba]

      // Cari pinalti general
      let totalGeneralPinalti = 0
      if (Array.isArray(generalPinalti)) {
        let found = generalPinalti.find(item =>
          item.no_peserta === peserta && item.lomba_id === lomba_id
        )
        totalGeneralPinalti = found ? found.total_pinalti_general : 0
      }

      // Inisialisasi objek peserta jika belum ada
      if (!pesertaMap[peserta]) pesertaMap[peserta] = {}
      if (!pesertaMap[peserta][lomba_id]) {
        pesertaMap[peserta][lomba_id] = {
          peserta,
          lomba_id,
          total_nilai_kategori_lomba: 0,
          sub_total_nilai: 0,
          total_nilai_lomba: 0,
          total_nilai_banding: 0,
          total_pinalti_general: totalGeneralPinalti // langsung set di sini
        }
      }

      // Tambahkan nilai juri ke total nilai kategori
      pesertaMap[peserta][lomba_id].total_nilai_kategori_lomba += total_nilai

      if (set_nilai === 'active') {
        pesertaMap[peserta][lomba_id].sub_total_nilai += total_nilai
      }

      if (nilai_banding === 'active') {
        pesertaMap[peserta][lomba_id].total_nilai_banding += total_nilai
      }

      // Hitung total_nilai_lomba = sub_total_nilai - total_pinalti_general
      pesertaMap[peserta][lomba_id].total_nilai_lomba =
        pesertaMap[peserta][lomba_id].sub_total_nilai -
        pesertaMap[peserta][lomba_id].total_pinalti_general
    }
  }

  // Langkah 2: Susun daftar peserta per lomba_id
  for (const peserta in pesertaMap) {
    for (const lomba_id in pesertaMap[peserta]) {
      if (!lombaRankingMap[lomba_id]) lombaRankingMap[lomba_id] = []
      lombaRankingMap[lomba_id].push(pesertaMap[peserta][lomba_id])
    }
  }

  for (const lomba_id in lombaRankingMap) {
    const pesertaList = lombaRankingMap[lomba_id];

    // Urutkan berdasarkan nilai akhir lalu nilai banding
    const sorted = pesertaList.sort((a, b) => {
      if (b.total_nilai_lomba !== a.total_nilai_lomba) {
        return b.total_nilai_lomba - a.total_nilai_lomba;
      } else {
        return b.total_nilai_banding - a.total_nilai_banding;
      }
    });

    // Proses pemberian rank dan status
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = i > 0 ? sorted[i - 1] : null;

      const currentFinal = current.total_nilai_lomba;
      const currentBanding = current.total_nilai_banding;

      // Jika nilai lomba 0, tidak diberi rank
      if (currentFinal === 0) {
        current.rank = null;
        current.points = 0;
        current.status = "No Rank";
        current.keterangan = "-";
        continue;
      }

      // Assign rank
      if (
        prev &&
        currentFinal === prev.total_nilai_lomba &&
        currentBanding === prev.total_nilai_banding
      ) {
        current.rank = prev.rank;
        current.status = "Draw";
      } else {
        current.rank = i + 1;
        current.status = "No Draw";
      }

      // Perbaiki status peserta sebelumnya jika baru terjadi draw
      if (
        prev &&
        currentFinal === prev.total_nilai_lomba &&
        currentBanding === prev.total_nilai_banding
      ) {
        prev.status = "Draw";
      }

      // Ambil informasi tambahan dari masterRank
      const rankInfo = masterRank.find(r => r.rank === current.rank);
      current.keterangan = rankInfo ? rankInfo.keterangan : "-";
      current.points = rankInfo ? rankInfo.points : 0;
    }
  }

  return lombaRankingMap
}

// Fungsi untuk mengakumulasi points dan data lomba berdasarkan no_peserta
function akumulasiPointsDenganLomba(data) {
  const akumulasiPoints = {};

  // Proses data lomba
  for (const lombaId in data) {
    data[lombaId].forEach(peserta => {
      const noPeserta = peserta.no_peserta;
      const points = peserta.points;
      const lomba = peserta.lomba_id;

      // Jika peserta sudah ada, tambahkan points dan lomba
      if (akumulasiPoints[noPeserta]) {
        akumulasiPoints[noPeserta].points += points;
        akumulasiPoints[noPeserta].lomba.push({ lomba_id: lomba, points: points });
      } else {
        // Jika belum ada, buat entri baru untuk peserta ini
        akumulasiPoints[noPeserta] = {
          no_peserta: noPeserta,
          points: points,
          lomba: [{ lomba_id: lomba, points: points }]
        };
      }
    });
  }

  return akumulasiPoints;
}

document.querySelectorAll('.filter-rekap-peserta').forEach(selectElement => {
  selectElement.addEventListener('change', setRekapNilai);
});

async function kategoriJuaraLombaModal() {
  if (userInfo.Group_position != "EP00") {
    Swal.fire({
      icon: 'warning',
      title: 'Akses Ditolak',
      text: 'Maaf, Anda tidak memiliki akses ke menu ini.',
      confirmButtonText: 'OK'
    })
    return false
  }
  openModal('#modal-update-kategori-juara');
  await createCategories()
  await setKategoriPenilaianJuara()
}

async function setResultRekapProgress() {
  try {
    let [rekapData, penguranganData] = await Promise.all([
      fetch('/loadNilaiRekap', { method: 'POST' }).then(res => res.json()).then(data => data.data),
      fetch('/loadPointPenguranganPeserta', { method: 'POST' }).then(res => res.json()).then(data => data.data)
    ]);
    const pesertaSubTotal = {};
    const pesertaPengurangan = {};

    rekapData.forEach(({ no_peserta, total_nilai_juri }) => {
      pesertaSubTotal[no_peserta] = (pesertaSubTotal[no_peserta] || 0) + total_nilai_juri;
    });

    penguranganData.forEach(({ no_peserta, point_pengurangan }) => {
      pesertaPengurangan[no_peserta] = (pesertaPengurangan[no_peserta] || 0) + point_pengurangan;
    });

    rekapData.forEach(({ no_peserta, lomba_id, kategori_penilaian_id, total_nilai_juri }) => {
      const kategoriElement = document.querySelector(`.col-kategori-penilaian[lomba-id="${lomba_id}"][kategori-id="${kategori_penilaian_id}"][peserta-no="${no_peserta}"]`);
      if (kategoriElement) {
        kategoriElement.classList.remove('nilai-diisi', 'nilai-belum-diberikan', 'tidak-ikut-lomba');
        kategoriElement.textContent = total_nilai_juri;
        kategoriElement.classList.add('nilai-diisi');
      }
    });

    for (const no_peserta in pesertaSubTotal) {
      const subtotal = pesertaSubTotal[no_peserta] || 0;
      const pinalti = pesertaPengurangan[no_peserta] || 0;
      const totalAkhir = subtotal - pinalti;

      const subEl = document.querySelector(`.col-sub-total[peserta-no="${no_peserta}"]`);
      const pinaltiEl = document.querySelector(`.col-nilai-pinalti[peserta-no="${no_peserta}"]`);
      const akhirEl = document.querySelector(`.col-total-akhir[peserta-no="${no_peserta}"]`);

      if (subEl) { subEl.textContent = subtotal; subEl.classList.add('subtotal-diisi'); }
      if (pinaltiEl) { pinaltiEl.textContent = pinalti; pinaltiEl.classList.add('pinalti-diisi'); }
      if (akhirEl) { akhirEl.textContent = totalAkhir; akhirEl.classList.add('totalakhir-diisi'); }
    }

    // Akumulasi poin pengurangan
    const akumulasiPengurangan = {};

    penguranganData.forEach(({ lomba_id, no_peserta, point_pengurangan }) => {
      const key = `${lomba_id}-${no_peserta}`;
      if (!akumulasiPengurangan[key]) {
        akumulasiPengurangan[key] = {
          lomba_id,
          no_peserta,
          total: 0
        };
      }
      akumulasiPengurangan[key].total += point_pengurangan;
    });

    // Tampilkan ke elemen HTML
    Object.values(akumulasiPengurangan).forEach(({ lomba_id, no_peserta, total }) => {
      const el = document.querySelector(`.col-nilai-pinalti-lomba[lomba-id="${lomba_id}"][peserta-no="${no_peserta}"]`);
      if (el) {
        el.textContent = total;
        el.classList.add('pinalti-lomba-diisi');
      } else {
        console.warn(`Element tidak ditemukan untuk lomba-id="${lomba_id}", peserta-no="${no_peserta}"`);
      }
    });


    await progressNilai()
  } catch (err) {
    console.error('Gagal memuat rekap:', err);
    alert('Terjadi kesalahan dalam memproses data');
  }
}

async function progressNilai() {
  try {
    let jumlahNilaiTidakNol = 0; // Pastikan ini dideklarasikan
    let allInputs = document.querySelectorAll('.col-juri input');
    let totalInput = allInputs.length;

    // Proses setiap input
    allInputs.forEach(el => {
      let nilai = parseFloat(el.value);
      // Hanya dihitung jika bernilai angka dan tidak 0
      if (!isNaN(nilai) && nilai !== 0) {
        jumlahNilaiTidakNol++;
      }
    });

    // Hitung progres
    let progressPersen = totalInput > 0 ? (jumlahNilaiTidakNol / totalInput) * 100 : 0;

    // Cek dan tampilkan progres
    const progressElement = document.getElementById('progres-nilai');
    if (progressElement) {
      progressElement.textContent = `${progressPersen.toFixed(0)}%`;
    } else {
      console.warn("Element dengan id 'progres-nilai' tidak ditemukan di DOM");
    }

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    // Tampilkan pesan kesalahan jika ada error yang terdeteksi
    Swal.fire({
      title: "Terjadi Kesalahan",
      text: "Ada masalah dalam menghitung progres nilai. Silakan coba lagi.",
      icon: "error",
      confirmButtonText: "OK"
    });
  }
}

async function fectDataOption() {
  // Mengambil data kategoriLomba, mataLomba, dan peserta
  const { kategoriLomba, mataLomba, peserta } = await getData();

  //dropdown kategori
  const kategoriField = document.getElementById('opt-filter-kategori-field');
  let kategoriListsField = `<option value="" selected>-- Semua Kategori Lomba --</option>`;
  kategoriLomba.forEach((kategori) => {
    kategoriListsField += `<option value="${kategori.kategori_id}">${kategori.nama_kategori}</option>`;
  });
  if (kategoriField) {
    kategoriField.innerHTML = kategoriListsField;
  }


  //dropdown kategori
  const mataLombaField = document.getElementById('opt-filter-mata-lomba-field');
  let mataLombaListsField = `<option value="" selected>-- Semua Mata Lomba --</option>`;
  mataLomba.forEach((mataLomba) => {
    mataLombaListsField += `<option value="${mataLomba.lomba_id}">${mataLomba.nama_lomba}</option>`;
  });

  if (mataLombaField) {

    mataLombaField.innerHTML = mataLombaListsField
  }

  //dropdown kategori
  const pesertaField = document.getElementById('opt-filter-peserta-field');
  let pesertaListsField = `<option value="" selected>-- Semua Peserta--</option>`;
  peserta.forEach((peserta) => {
    pesertaListsField += `<option value="${peserta.no_peserta}">${peserta.nama_pangkalan} - ${peserta.no_peserta}</option>`;
  });

  if (pesertaField) {
    pesertaField.innerHTML = pesertaListsField
  }
}

async function updateKategoriJuara(el, act) {
  // Mengambil nilai kategori juara dan jumlah juara dari input
  kategoriJuara = document.getElementById('add-kategori-juara-field').value;
  jumlahJuara = document.getElementById('add-jumlah-juara-field').value;

  // Kondisi untuk menambah kategori juara baru
  if (act == 'add') {
    idKategori = '';  // ID kategori juara kosong saat menambah kategori baru

    // Memastikan nama kategori diinputkan
    if (!kategoriJuara) {
      Swal.fire(
        'Hold on!',
        'Please input category name!',
        'warning'
      );
      return false;
    }

    if (!jumlahJuara) {
      Swal.fire(
        'Hold on!',
        'Please input total number of juara!',
        'warning'
      );
      return false;
    }
  }

  // Kondisi untuk mengedit kategori juara
  if (act == "edit") {
    boxCategoryList = el.closest('.box-category-content');

    document.querySelectorAll('.box-category-content').forEach(box => {
      box.classList.remove('active');
    });
    boxCategoryList.classList.add('active');
  }

  // Kondisi untuk memperbarui kategori juara
  if (act == "update") {
    boxCategoryList = el.closest('.box-category-content');
    idKategori = boxCategoryList.getAttribute('category-id');
    kategoriJuara = boxCategoryList.querySelector('input').value;  // Ambil nilai input dari kategori juara
    setNilai = 'active'; // Misalkan nilai selalu diatur ke 'active'
  }

  if (act == "delete") {
    boxCategoryList = el.closest('.kateori-point-juara');
    idKategori = boxCategoryList.getAttribute('data-id');
  }

  // Konfirmasi apakah pengguna ingin menambahkan atau memperbarui kategori juara
  if (act == 'add' || act == 'update' || act == 'delete') {
    let infoSwal = `<span>Nama Kategori : <b> ${kategoriJuara} </b></span><br><span>Total Juara: <b>${jumlahJuara}</b></span><br>`;
    let iconSwal = `<i class="fa fa-plus"></i>`;

    // Menampilkan Swal untuk konfirmasi
    Swal.fire({
      title: "Hold on!",
      html: `Are you sure to ${act} this kategori juara? <br><br>` + infoSwal,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: colorThemes["b7-clr-org-1"],
      cancelButtonColor: colorThemes["b7-clr-blu-2"],
      confirmButtonText: "Yes!",
      confirmButtonText: `${iconSwal} Yes, ${act} this!`,
      confirmButtonAriaLabel: 'Update!',
      cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
      cancelButtonAriaLabel: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        // Jika konfirmasi diterima, kirim data ke API
        $.ajax({
          url: 'updateKategoriJuara', // Ganti dengan endpoint untuk kategori juara
          type: 'POST',
          dataType: "JSON",
          data: {
            id: idKategori,
            kategori_juara: kategoriJuara,
            total_juara: jumlahJuara,
            act: act,
          },
          beforeSend: function () {
            openLoader(); // Fungsi untuk membuka loader
          },
          success: function (data) {
            // Tampilkan hasil success atau failure
            if (data == "success") {
              Swal.fire({
                title: '<strong>Success</strong>',
                icon: 'success',
                html: `Successfully ${act} this kategori juara! <br><br>` + infoSwal
              });
            } else {
              Swal.fire({
                title: '<strong>Hold on!</strong>',
                icon: 'warning',
                html: `Failed to ${act} this kategori juara! <br><br>` + infoSwal
              });
            }
          },
          complete: async function () {
            await createCategories()
            await setKategoriPenilaianJuara()
            if (act == 'add') {
              document.getElementById('add-jumlah-juara-field').value = ''
              document.getElementById('add-kategori-juara-field').value = ''
            }
            closeLoader(); // Fungsi untuk menutup loader
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Jika pembatalan dilakukan
        Swal.fire({
          title: '<strong>Cancelled!</strong>',
          icon: 'info',
          html: `Cancel to ${act} this kategori juara! <br><br>` + infoSwal
        });
      }
    });
  }
}

// Input Rekap 
async function generateSidebar() {
  const {
    mataLomba
  } = await getData();
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

  if (container) {
    container.innerHTML = sidebarHTML;
  }
}

// Fungsi untuk menangani klik pada lombaHeader, ditambahkan di dalam HTML lewat 'onclick'
async function handleLombaHeaderClick(event) {
  const lombaHeaders = document.getElementsByClassName('lomba-header')
  const getAksesJuri = aksesJuri.find(item => item.user === userInfo.Group_position)
  const lombaId = event.currentTarget.getAttribute('data-lomba-id')
  if (
    userInfo.Group_position !== "EP00" &&
    lombaId != getAksesJuri?.input_akses
  ) {
    Swal.fire({
      icon: 'warning',
      title: 'Akses Ditolak',
      text: 'Maaf, Anda tidak memiliki akses ke menu ini.',
      confirmButtonText: 'OK'
    })
    return false
  }

  // Hapus kelas 'active' dari semua elemen
  for (let header of lombaHeaders) {
    header.classList.remove('active')
  }

  // Tambahkan kelas 'active' pada yang diklik
  event.currentTarget.classList.add('active')

  const element = document.getElementById('wrap-body-lembar-penilaian')
  element.classList.remove('active')
  element.classList.add('active')

  document.getElementById('tableBody').innerHTML = ''

  // Menampilkan peserta yang sesuai dengan lomba yang dipilih
  if (document.querySelector('#wrap-content-body-rekap .sidebar.active')){
    showMataLomba()
  }
  
  document.querySelector('#detail-lembar-jawaban-peserta .no-data-content').style.display = 'none'

  await showParticipants(lombaId)

  // Klik otomatis peserta pertama (jika ada)
  const firstButton = document.querySelector('.btn-peserta-lomba')
  if (firstButton) firstButton.click()
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

// Fungsi untuk mengumpulkan nilai dan mengirim ke server
function saveNilai(act) {
  const rows = document.querySelectorAll("#sub-point-table-list tbody .row-sub-point");
  const noPeserta = document.querySelector('.btn-peserta-lomba.active').getAttribute('data-no-peserta');
  const lombaId = document.querySelector('.lomba-header.active').getAttribute('data-lomba-id');

  let nilaiData = [];

  // Iterasi melalui setiap baris untuk mendapatkan nilai per sub-point
  rows.forEach(row => {
    const subPointId = row.querySelector("td:first-child").getAttribute('data-id');
    const kategoriId = row.getAttribute('kategori-id');
    const kategoriSubPointId = row.getAttribute('kategori-sub_point-id');
    const subPointName = row.querySelector("td:first-child").textContent.trim();

    const nilaiJuri = [];
    const juriInputs = row.querySelectorAll(".sub-nilai-field");

    juriInputs.forEach(input => {
      if (input.value === "") return; // Lewati input kosong

      nilaiJuri.push({
        nama_juri: input.getAttribute("data-juri"),
        nilai: parseFloat(input.value) || 0,
        id: Number(input.getAttribute("data-id"))
      });
    });

    if (nilaiJuri.length > 0) {
      nilaiData.push({
        no_peserta: noPeserta,
        lomba_id: Number(lombaId),
        kategori_sub_point_id: Number(kategoriSubPointId),
        kategori_id: Number(kategoriId),
        sub_point_id: Number(subPointId),
        sub_point_name: subPointName,
        nilai_juri: nilaiJuri
      });
    }
  });

  // Validasi jika tidak ada data untuk dikirim
  if (nilaiData.length < 1) {
    Swal.fire('Hold on!', 'No valid nilai data to submit!', 'warning');
    return;
  }

  let infoSwal = `<span>No Peserta : <b>${noPeserta}</b></span><br>`;
  infoSwal += `<span>Lomba ID : <b>${lombaId}</b></span><br>`;
  infoSwal += `<span>Total Sub-points : <b>${nilaiData.length}</b></span>`;

  let iconSwal = act === "update" ? `<i class="fas fa-pencil-alt"></i>` : `<i class="fa fa-plus"></i>`;

  Swal.fire({
    title: "Hold on!",
    html: `Are you sure you want to ${act} these nilai? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: `${iconSwal} Yes, ${act} this!`,
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
  }).then((result) => {
    // Jalankan aksi langsung tanpa konfirmasi
    $.ajax({
      url: '/updateNilai', // pastikan ini endpoint benar di backend
      type: 'POST',
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify({
        act: act,
        nilai_data: nilaiData
      }),
      beforeSend: function () {
        openLoader();
      },
      success: function (data) {
        // Menampilkan swal untuk konfirmasi sukses
        Swal.fire({
          title: '<strong>Berhasil</strong>',
          icon: 'success',
          html: `Berhasil ${act} sub point! <br><br>` + infoSwal,
          timer: 500, // Menutup swal setelah 500 ms (0.5 detik)
          showConfirmButton: false
        });
      },
      error: function (xhr, status, error) {
        // Menampilkan swal untuk error
        Swal.fire({
          title: '<strong>Gagal!</strong>',
          icon: 'error',
          html: `Gagal ${act} sub point! Error: ${xhr.responseText || error}`,
          timer: 500, // Menutup swal setelah 500 ms (0.5 detik)
          showConfirmButton: false
        });
      },
      complete: async function () {
        closeLoader();
        await setNilaiJuri(lombaId);
        await updateTotalNilai(lombaId)
        await setRekapNilai()
      }
    });
  });
}


async function savePointPengurangan(el, act) {
  // Mengambil nilai dari input form
  let boxPointPengurangan = el.closest('.box-category-content')
  idlomba = Number(document.querySelector('.lomba-header.active').getAttribute('data-lomba-id'))
  idKategori = boxPointPengurangan.getAttribute('kategori-id')
  noPeserta = document.querySelector('.btn-peserta-lomba.active').getAttribute('data-no-peserta')
  kriteriaPenguranganId = boxPointPengurangan.getAttribute('data-id')
  pointPengurangan = boxPointPengurangan.querySelector('.pengurangan-nilai-field').value
  pointPenguranganId = boxPointPengurangan.querySelector('.pengurangan-nilai-field').getAttribute('kriteria-id')

  if (!pointPengurangan) {
    Swal.fire(
      'Tunggu Sebentar!',
      'Harap masukkan point pengurangan!',
      'warning'
    );
    return false;
  }
  if (pointPenguranganId > 0) {
    act = 'udate'
  }

  // Langsung jalankan AJAX tanpa konfirmasi SweetAlert
  let infoSwal = `<span>Point Pengurangan : <b> ${pointPengurangan} </b></span><br>`;
  let iconSwal = `<i class="fa fa-plus"></i>`;

  $.ajax({
    url: 'savePointPenguranganPeserta',  // Endpoint untuk menyimpan data
    type: 'POST',
    dataType: "JSON",
    data: {
      id: pointPenguranganId,
      no_peserta: noPeserta,
      kategori_id: idKategori,
      lomba_id: idlomba,
      kriteria_point_id: kriteriaPenguranganId,
      point_pengurangan: pointPengurangan,
      act: act,
    },
    beforeSend: function () {
      openLoader();
    },
    success: function (data) {
      if (data == "success") {
        Swal.fire({
          title: '<strong>Berhasil</strong>',
          icon: 'success',
          html: `Berhasil ${act} point pengurangan! <br><br>` + infoSwal,
          timer: 500, // menutup setelah 0.5 detik
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          title: '<strong>Perhatian!</strong>',
          icon: 'warning',
          html: `Gagal ${act} point pengurangan! <br><br>` + infoSwal,
          timer: 1000, // menutup setelah 1 detik
          showConfirmButton: false
        });
      }
    },
    complete: async function () {
      await setNilaiPengurangan()
      closeLoader();
    }
  });
}

async function showParticipants(lombaId) {
  try {
    const { peserta } = await getData(); // Ambil data peserta dari server
    const pesertaData = peserta;

    // Urutkan berdasarkan angka di akhir no_peserta (natural sort)
    pesertaData.sort((a, b) => {
      const extractNumber = str => parseInt(str.match(/\d+$/)[0]); // Ambil angka dari akhir string
      return extractNumber(a.no_peserta) - extractNumber(b.no_peserta);
    });

    // Menampilkan peserta ke dalam elemen HTML
    const wrapPesertaList = document.getElementById('peserta-list-container');
    const contentPeserta = pesertaData.map(item => `
      <button onclick="showSubPointPeserta(this, ${lombaId})" 
              data-pangkalan="${item.nama_pangkalan}" 
              data-no-peserta="${item.no_peserta}" 
              class="btn-peserta-lomba">
        <i class="bi bi-file-earmark-person-fill"></i> ${item.no_peserta}
      </button>
    `).join('');

    wrapPesertaList.innerHTML = contentPeserta;
    return 'ok';
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    throw error;
  }
}

async function setSubPointContent(lombaId) {
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

    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = ''; // Clear existing content

    if (subPointData) {
      const groupedData = subPointData.reduce((acc, item) => {
        acc[item.nama_kategori_sub_point] = acc[item.nama_kategori_sub_point] || [];
        acc[item.nama_kategori_sub_point].push(item);
        return acc;
      }, {});

      for (const category in groupedData) {
        const items = groupedData[category];
        const kategoriId = items[0]?.kategori_id;

        // Header row
        const headerSubPoint = `
          <tr class="category-header">
            <td class="head-judul-sub-point">${category}</td>
            ${Array.from({ length: totalJuri }, (_, index) => `
              <td style="width:80px;" class="head-juri">Juri ${index + 1}</td>
            `).join('')}
            <td class="head-total">Total</td>
          </tr>
        `;
        tableBody.innerHTML += headerSubPoint;

        // Sub-point rows
        items.forEach(item => {
          const row = document.createElement("tr");
          row.setAttribute('data-id', item.sub_point_id);
          row.setAttribute('kategori-sub_point-id', item.kategori_sub_point_id);
          row.setAttribute('kategori-id', item.kategori_id);
          row.classList.add('row-sub-point');

          row.innerHTML = `
            <td data-id="${item.sub_point_id}">${item.nama_sub_point}</td>
            ${Array.from({ length: totalJuri }, (_, index) => `
              <td class="col-juri">
                <section class="basic-flex-reverse">
                  <div class="form-input basic-flex-reverse">
                    <input data-juri="juri ${index + 1}" data-id="0" class="sub-nilai-field" type="number" placeholder="Input">
                  </div>
                </section>
              </td>
            `).join('')}
            <td class="col-total total-column">0</td>
          `;
          tableBody.appendChild(row);
        });

        // Footer total per kategori-sub-point
        const kategoriSubPointId = items[0]?.kategori_sub_point_id;
        const totalRow = document.createElement("tr");
        totalRow.classList.add('row-total-per-kategori');
        totalRow.setAttribute('kategori-sub-point-id', kategoriSubPointId);

        totalRow.innerHTML = `
          <td class="total-kategori-label"><strong>Total ${category}</strong></td>
          ${Array.from({ length: totalJuri }, (_, index) => `
            <td class="total-kategori-juri" data-juri="juri ${index + 1}">0</td>
          `).join('')}
          <td class="total-kategori-sum">0</td>
        `;
        tableBody.appendChild(totalRow);

      }
    }

    return 'ok';
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    throw error;
  }
}

function calculateCategoryTotals() {
  // Reset semua total kategori dulu
  document.querySelectorAll('.total-kategori-juri').forEach(cell => cell.textContent = '0');
  document.querySelectorAll('.total-kategori-sum').forEach(cell => cell.textContent = '0');
  document.querySelectorAll('.col-total').forEach(cell => cell.textContent = '0');

  const kategoriMap = {};

  // Loop semua baris sub-point
  document.querySelectorAll('.row-sub-point').forEach(row => {
    const kategoriId = row.getAttribute('kategori-id');
    const inputs = row.querySelectorAll('input.sub-nilai-field');

    let rowTotal = 0;

    inputs.forEach((input, juriIndex) => {
      const nilai = parseFloat(input.value) || 0;
      rowTotal += nilai;

      if (!kategoriMap[kategoriId]) {
        kategoriMap[kategoriId] = { juriTotals: [], sum: 0 };
      }

      if (!kategoriMap[kategoriId].juriTotals[juriIndex]) {
        kategoriMap[kategoriId].juriTotals[juriIndex] = 0;
      }

      kategoriMap[kategoriId].juriTotals[juriIndex] += nilai;
      kategoriMap[kategoriId].sum += nilai;
    });

    // Update total baris
    const colTotal = row.querySelector('.col-total');
    if (colTotal) colTotal.textContent = rowTotal.toFixed(2);
  });

  // Masukkan total kategori ke baris total
  Object.entries(kategoriMap).forEach(([kategoriId, data]) => {
    const totalRow = document.querySelector(`.row-total-per-kategori[kategori-id="${kategoriId}"]`);
    if (!totalRow) return;

    const juriCells = totalRow.querySelectorAll('.total-kategori-juri');
    data.juriTotals.forEach((value, index) => {
      if (juriCells[index]) juriCells[index].textContent = value.toFixed(2);
    });

    const sumCell = totalRow.querySelector('.total-kategori-sum');
    if (sumCell) sumCell.textContent = data.sum.toFixed(2);
  });
}


async function showSubPointPeserta(el, lombaId) {
  document.querySelectorAll('.btn-peserta-lomba').forEach(element => element.classList.remove('active'));
  el.classList.add('active');
  mataLomba = document.querySelector('.lomba-header.active span').textContent

  document.getElementById('header-pangkalan-sub-point').textContent = `${el.getAttribute('data-pangkalan')}`;
  document.getElementById('header-mata-lomba').textContent = `${mataLomba}`;
  await setSubPointContent(lombaId);
  await setNilaiJuri(lombaId);
  await showKategoriPengurangan(lombaId);
  await updateTotalNilai(lombaId);
}

// Fungsi untuk menghitung dan memperbarui total nilai per sub-point
async function updateTotalNilai(lombaId) {
  try {
    const noPeserta = document.querySelector('.btn-peserta-lomba.active').getAttribute('data-no-peserta');
    const formData = new FormData();
    formData.append('lomba_id', lombaId);
    formData.append('no_peserta', noPeserta);

    const [subPointResponse, kategoriPenilaianResponse] = await Promise.all([
      fetch('/loadNilaiJuriList', { method: 'POST', body: formData }).then(res => res.json()),
      fetch('/loadKategoriPenilaian', { method: 'POST', body: formData }).then(res => res.json())
    ]);

    const subPointData = subPointResponse.data || [];
    const kategoriData = kategoriPenilaianResponse.data || [];

    // Tambahkan kategori_id 0 jika lombaId == 11
    if (lombaId === '11' || lombaId === 11) {
      kategoriData.push({
        kategori_id: 0,
        nama_kategori: "Pengurangan Pasukan",
        nama_lomba: "LKBBT"
      });
    }

    document.querySelectorAll('#tableBody .col-total').forEach(element => element.textContent = '0');
    await setNilaiPengurangan(); // Ini akan menghitung nilai pengurangan dan memperbarui data-pinalti

    if (subPointData.length > 0) {
      subPointData.forEach(item => {
        const row = document.querySelector(`#tableBody .row-sub-point[data-id="${item.sub_point_id}"][kategori-sub_point-id="${item.kategori_sub_point_id}"][kategori-id="${item.kategori_penilaian_id}"]`);
        if (row) {
          const total = Array.from(row.querySelectorAll('input'))
            .reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);
          row.querySelector(".col-total").textContent = total;
        }
      });
    }

    // Tampilkan total untuk masing-masing kategori
    const kategoriContent = kategoriData
      .filter(item => item.kategori_id !== 0)  // filter keluar kategori_id 0
      .map(item => `
    <div data-id="${item.kategori_id}" class="filter-icon form-input field-box wrap-footer-info-content">
      <label>Total ${item.nama_kategori} :</label>
      <span class="footer-info-total">0</span>
    </div>
  `).join('');

    document.getElementById('info-total-kategori-penilaian').innerHTML = kategoriContent;

    let subTotalNilai = 0;
    kategoriData.forEach(kategori => {
      let totalNilaiKategori = 0;
      const filteredData = subPointData.filter(item => item.kategori_penilaian_id == kategori.kategori_id); // pakai == untuk dukung numeric/string

      filteredData.forEach(valueKategori => {
        totalNilaiKategori += parseFloat(valueKategori.nilai_juri) || 0;
        subTotalNilai += parseFloat(valueKategori.nilai_juri) || 0;
      });

      const kategoriElement = document.querySelector(`.wrap-footer-info-content[data-id="${kategori.kategori_id}"] .footer-info-total`);
      if (kategoriElement) {
        kategoriElement.textContent = totalNilaiKategori;
      }
    });

    // Update subtotal nilai
    document.getElementById('sub-total-nilai').textContent = subTotalNilai || 0;

    // Ambil nilai pinalti
    const nilaiPinalti = parseFloat(document.getElementById('total-pinalti-nilai').getAttribute('data-value')) || 0;
    const totalAkhir = subTotalNilai - nilaiPinalti;

    document.getElementById('total-akhir-nilai').textContent = totalAkhir ? parseFloat(totalAkhir.toFixed(2)) : 0;

    return 'ok';
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    throw error;
  }
}

async function setNilaiJuri() {
  try {
    const lombaId = document.querySelector('.lomba-header.active')?.getAttribute('data-lomba-id');
    const noPeserta = document.querySelector('.btn-peserta-lomba.active')?.getAttribute('data-no-peserta');

    if (!lombaId || !noPeserta) return;

    const formData = new FormData();
    formData.append('lomba_id', lombaId);
    formData.append('no_peserta', noPeserta);

    const response = await fetch('/loadNilaiJuriList', { method: 'POST', body: formData });
    const data = (await response.json()).data;

    // Reset input nilai
    document.querySelectorAll('#tableBody .sub-nilai-field.done').forEach(element => {
      element.value = '';
      element.closest('.form-input')?.classList.remove('done');
      element.setAttribute('data-id', 0);
    });

    if (data) {
      data.forEach(item => {
        const selector = `#tableBody .row-sub-point[data-id="${item.sub_point_id}"][kategori-sub_point-id="${item.kategori_sub_point_id}"][kategori-id="${item.kategori_penilaian_id}"]`;
        const row = document.querySelector(selector);
        if (row) {
          const input = row.querySelector(`.sub-nilai-field[data-juri="${item.nama_juri}"]`);
          if (input) {
            input.value = parseFloat(item.nilai_juri) || 0;
            input.closest('.form-input')?.classList.add('done');
            input.setAttribute('data-id', item.id);
          }
        }
      });
    }

    setupLiveCalculation();        // Aktifkan auto hitung
    calculateCategoryTotals();     // Hitung setelah set nilai
    await progressNilai();         // Lanjut proses lainnya
    return 'ok';

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    throw error;
  }
}

function calculateCategoryTotals() {
  const kategoriMap = {};
  const barisMap = {};

  document.querySelectorAll('.row-sub-point').forEach(row => {
    const subPointId = row.getAttribute('data-id');
    const kategoriSubId = row.getAttribute('kategori-sub_point-id');
    const kategoriId = row.getAttribute('kategori-id');
    const barisKey = `${subPointId}_${kategoriSubId}_${kategoriId}`;

    let rowTotal = 0;

    row.querySelectorAll('input.sub-nilai-field').forEach(input => {
      const juri = input.getAttribute('data-juri');
      const nilai = parseFloat(input.value) || 0;

      rowTotal += nilai;

      if (!kategoriMap[kategoriSubId]) {
        kategoriMap[kategoriSubId] = { juriTotals: {}, sum: 0 };
      }

      if (!kategoriMap[kategoriSubId].juriTotals[juri]) {
        kategoriMap[kategoriSubId].juriTotals[juri] = 0;
      }

      kategoriMap[kategoriSubId].juriTotals[juri] += nilai;
      kategoriMap[kategoriSubId].sum += nilai;
    });

    barisMap[barisKey] = rowTotal;
  });

  // Update total per baris
  Object.entries(barisMap).forEach(([key, total]) => {
    const [sub_id, sub_kat_id, kat_id] = key.split('_');
    const row = document.querySelector(`#tableBody .row-sub-point[data-id="${sub_id}"][kategori-sub_point-id="${sub_kat_id}"][kategori-id="${kat_id}"]`);
    if (row) {
      const cell = row.querySelector('.col-total');
      if (cell) cell.textContent = parseFloat(total.toFixed(2))
    }
  });

  // Update total per kategori-sub-point
  Object.entries(kategoriMap).forEach(([subKatId, obj]) => {
    const totalRow = document.querySelector(`.row-total-per-kategori[kategori-sub-point-id="${subKatId}"]`);
    if (!totalRow) return;

    totalRow.querySelectorAll('.total-kategori-juri').forEach(td => {
      const juri = td.getAttribute('data-juri');
      const nilai = parseFloat(obj.juriTotals[juri]) || 0;
      td.textContent = parseFloat(nilai.toFixed(2))
    });

    const sumCell = totalRow.querySelector('.total-kategori-sum');
    if (sumCell) sumCell.textContent = parseFloat(obj.sum.toFixed(2))
  });
}

function setupLiveCalculation() {
  document.querySelectorAll('input.sub-nilai-field').forEach(input => {
    input.removeEventListener('input', calculateCategoryTotals); // Hindari duplikat
    input.addEventListener('input', calculateCategoryTotals);
  });
}

async function showKategoriPengurangan(lombaId) {
  const formData = new FormData();
  formData.append('lomba_id', lombaId);

  const kategoriPenilaianResponse = await fetch('/loadKategoriPenilaian', {
    method: 'POST',
    body: formData
  });

  const kategoriData = (await kategoriPenilaianResponse.json()).data;

  // Tambah kategori_id 0 jika lombaId == 11
  if (lombaId === '11' || lombaId === 11) {
    kategoriData.push({
      kategori_id: 0,
      nama_kategori: "Pengurangan Pasukan",
      nama_lomba: "Umum"
    });
  }

  let contentSubPoint = ``;
  kategoriData.forEach(item => {
    contentSubPoint += `<section class="box-sub-point">`;
    contentSubPoint += `
      <section data-kategori="" class="header-sub-point">
        <span>${item.nama_kategori}</span>
        <span class="total-pengurangan-kategori" data-id="${item.kategori_id}">Total : 0</span>
      </section>
      <section data-id="${item.kategori_id}" class="keriteria-pengurangan-list sub-point-list"></section>
    `;
    contentSubPoint += `</section>`;
  });

  document.getElementById('content-pengurangan-nilai-lists').innerHTML = contentSubPoint;

  await setKategoriPenguranganPoint();
}

async function setKategoriPenguranganPoint() {
  try {
    const lombaId = document.querySelector('.lomba-header.active').getAttribute('data-lomba-id');
    const formData = new FormData();
    formData.append('lomba_id', lombaId);

    const kategoriPenilaianResponse = await fetch('/loadKategoriPenilaian', {
      method: 'POST',
      body: formData
    });
    const kategoriData = (await kategoriPenilaianResponse.json()).data;

    if (lombaId === '11' || lombaId === 11) {
      kategoriData.push({
        kategori_id: 0,
        nama_kategori: "Pengurangan Pasukan",
        nama_lomba: "Umum"
      });
    }

    const kriteriaPenguranganResponse = await fetch('/loadKategoriPenguranganPoint', {
      method: 'POST',
      body: formData
    });
    const kriteriaPenguranganData = (await kriteriaPenguranganResponse.json()).data;

    kategoriData.forEach(value => {
      let contentKriteria = '';
      const dataKriteriaList = kriteriaPenguranganData.filter(item => item.kategori_id == value.kategori_id);

      dataKriteriaList.forEach(item => {
        const itemKriteriaArr = item.kriteria_point_pengurangan.split('-').filter(val => val.trim() !== "");
        let itemContent = `
          <section value="${item.kriteria_point_pengurangan}" data-id="${item.id}" kategori-id="${item.kategori_id}" class="box-category-content">
        `;
        itemContent += itemKriteriaArr.map((val, index) =>
          `<span style="display: block;">${itemKriteriaArr.length > 1 ? (index + 1) + '. ' : ''}${val}</span>`
        ).join('');

        itemContent += `
          <div class="form-input basic-flex-reverse" style="gap: 0;padding: 3px;border-radius: 5px;">
            <input data-id="${item.id}" class="pengurangan-nilai-field" type="number" placeholder="Input" style="font-size: 14px;">
            <button id="btn-save-nilai" onclick="savePointPengurangan(this,'add')" title="Simpan Nilai" style="height: 100%;width: 40px;font-size: 18px;"><i class="bx bxs-save"></i></button>
          </div>
        </section>`;
        contentKriteria += itemContent;
      });

      const kategoriListElement = document.querySelector(`.keriteria-pengurangan-list[data-id="${value.kategori_id}"]`);
      if (kategoriListElement) {
        kategoriListElement.innerHTML = contentKriteria;
      }
    });
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

async function setNilaiPengurangan() {
  try {
    const lombaHeader = document.querySelector('.lomba-header.active');
    const pesertaButton = document.querySelector('.btn-peserta-lomba.active');
    const lombaId = lombaHeader ? lombaHeader.getAttribute('data-lomba-id') : null;
    const noPeserta = pesertaButton ? pesertaButton.getAttribute('data-no-peserta') : null;

    if (!lombaId || !noPeserta) {
      throw new Error('Lomba ID or Peserta ID not found');
    }

    const formData = new FormData();
    formData.append('lomba_id', lombaId);
    formData.append('no_peserta', noPeserta);

    const response = await fetch('/loadPointPenguranganPeserta', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    const data = result.data || [];

    document.querySelectorAll('.pengurangan-nilai-field.done').forEach(element => {
      element.value = '';
      element.classList.remove('done');
      element.setAttribute('kriteria-id', 0);
    });

    data.forEach(item => {
      const row = document.querySelector(`.box-category-content[data-id="${item.kriteria_point_id}"][kategori-id="${item.kategori_id}"]`);
      if (row) {
        const field = row.querySelector('.pengurangan-nilai-field');
        if (field) {
          field.value = item.point_pengurangan;
          field.classList.add('done');
          field.setAttribute('kriteria-id', item.id);
        }
      }
    });

    let totalPinalti = 0;

    document.querySelectorAll('.total-pengurangan-kategori').forEach(element => {
      const dataId = element.getAttribute('data-id');
      const resultPoint = data.filter(item => String(item.kategori_id) === dataId);

      let total = resultPoint.reduce((sum, input) => sum + (parseFloat(input.point_pengurangan) || 0), 0);
      totalPinalti += total;
      element.textContent = `Total : ${total}`;
    });

    document.querySelectorAll('.total-nilai-pinalti').forEach(element => {
      element.textContent = totalPinalti;
      element.setAttribute('data-value', totalPinalti);
    });

    return 'ok';
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    throw error;
  }
}


function showPenguranganPoint() {
  document.getElementById('wrap-pengurangan-nilai').classList.toggle('active')
}
function showMataLomba() {
  document.querySelector('#wrap-content-body-rekap .sidebar').classList.toggle('active')
}
function showRekapContent(el, id) {
  // Menghapus kelas 'active' dari semua tombol rekap lomba

  if (id == 'wrap-rekap-juara') {
    if (userInfo.Group_position != "EP00" && userInfo.Group_position != "EP01" && userInfo.Group_position !== "EP04" && userInfo.Group_position !== "EP05" && userInfo.Group_position !== "EP06" && userInfo.Group_position !== "EP07") {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Maaf, Anda tidak memiliki akses ke menu ini.',
        confirmButtonText: 'OK'
      })
      return false
    }
  }
  if (id == 'rekap-content-section' || id == 'wrap-body-lembar-penilaian') {
    if (userInfo.Group_position != "EP00" && userInfo.Group_position != "EP01") {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Maaf, Anda tidak memiliki akses ke menu ini.',
        confirmButtonText: 'OK'
      })
      return false
    }
  }


  document.querySelectorAll('.btn-rekap-lomba').forEach(element => {
    element.classList.remove('active');
  });

  // Menyembunyikan semua konten rekap
  document.querySelectorAll('.content-rekap').forEach(element => {
    element.classList.remove('show');
    element.style.display = 'none'; // Menggunakan style.display untuk menyembunyikan konten
  });

  // Menambahkan kelas 'active' ke elemen yang diklik
  el.classList.add('active');

  // Menampilkan konten yang sesuai dengan ID
  const contentElement = document.getElementById(id);
  contentElement.classList.add('show');
  contentElement.style.display = 'block'; // Menampilkan konten yang sesuai
}

async function showRekapJuaraTb(el, KategoriJuaraId) {
  try {
    // Membuat FormData dan mengirimkan request ke server
    const formData = new FormData();
    formData.append('kategori_juara_id', KategoriJuaraId);

    const response = await fetch('/loadKategoriPenilaianJuara', {
      method: 'POST',
      body: formData
    });

    // Menangani jika response tidak berhasil
    if (!response.ok) {
      throw new Error('Gagal memuat data.');
    }

    const result = await response.json();
    const data = result.data || [];

    // // Filter data lomba yang unik berdasarkan nama_lomba
    const lombaData = data
      .filter((value, index, self) =>
        index === self.findIndex((t) => t.nama_lomba === value.nama_lomba)
      )
      .map(item => ({
        lomba_id: item.lomba_id,
        nama_lomba: item.nama_lomba
      }));


      
      // Menangani elemen header lomba
      let lombaHeaders = document.querySelectorAll('#kategori-juara-list-menu .kategori-juara-header');

    // Menghapus kelas 'active' dari semua elemen header lomba
    lombaHeaders.forEach(header => {
      header.classList.remove('active');
    });

    // Menambahkan kelas 'active' pada elemen yang diklik
    el.classList.add('active');
    
    // Panggil fungsi untuk menampilkan rekap juara
    document.querySelector('#table-rekap-juara-section thead').innerHTML = ''
    document.querySelector('#table-rekap-juara-section tbody').innerHTML = ''

    document.querySelector('#table-rekap-juara-section .no-data-content').style.display = 'none'
    document.querySelector('#table-rekap-juara-section #tabel-rekap-juara-lomba').style.display = 'table'

    sidebarRekap = document.querySelector('#wrap-rekap-juara .sidebar.active')
    if (sidebarRekap) {
      sidebarMobileRekap()
    }
    await setRekapJuara(lombaData, data);
  } catch (error) {
    console.error('Error:', error.message);
    // Tampilkan error kepada pengguna atau lakukan penanganan lainnya
    alert('Terjadi kesalahan saat memuat data.');
  }
}


async function createCategories() {
  try {
    // Fetch KategoriJuara data
    let responseDataKategoriJuara = await fetch('/loadKategoriJuara', { method: 'POST' });
    let resultKategoriJuara = await responseDataKategoriJuara.json();
    let data = resultKategoriJuara.data || [];

    // Fetch RekapBanding data
    let responseRekapBanding = await fetch('/loadRekapBandingKategoriJuara', { method: 'POST' });
    let rekapBanding = await responseRekapBanding.json();
    // Fetch KategoriPenilaianAll data
    const { data: kategoripenilaianLists } = await fetch('/loadKategoriPenilaianAll', { method: 'POST' }).then(res => res.json());

    const classifiedData = kategoripenilaianLists.reduce((acc, item) => {
      if (!acc[item.nama_lomba]) {
        acc[item.nama_lomba] = [];
      }
      acc[item.nama_lomba].push(item);
      return acc;
    }, {});

    // Get container
    const categoriesContainer = document.getElementById("wrap-content-list-kategori-juara");
    categoriesContainer.innerHTML = "";

    const { mataLomba } = await getData();
    const lombaData = mataLomba;

    let options = '<option value="">Pilih Mata Lomba</option> <option value="0">None</option>';
    lombaData.forEach(lomba => {
      options += `<option value="${lomba.lomba_id}">${lomba.nama_lomba}</option>`;
    });

    if (data.length > 0) {
      const contentSubPoint = data.map(category => {
        // Cari data rekapBanding berdasarkan kategori id
        const existingRekap = (rekapBanding.data || []).find(r => r.kategori_juara_id === category.id) || {};
        const action = existingRekap.kategori_juara_id ? 'update' : 'add';
        const rekapBandingId = existingRekap.id || ''; // id rekap banding kalau ada

        return `
        <section data-id="${category.id}" data-kategori="${category.kategori_juara}" class="box-sub-point kateori-point-juara">
          <section data-id="${category.id}" data-kategori="${category.kategori_juara}" class="header-sub-point">
            <section class="header-info-kategori-juara">
              <span>${category.kategori_juara}</span>
              <span>Total Juara: ${category.total_juara}</span>
            </section>
            <button onclick="updateKategoriJuara(this,'delete')" class="btn-delete-sub-point"> 
              <i class="fa fa-trash"></i>
            </button>
            <button onclick="editSubPointList(this)" class="btn-edit-sub-point"> 
              <i class="fas fa-pencil-alt"></i>
            </button>
            <button onclick="checkKategoriJuara(this)" class="btn-check-sub-point"> 
              <i class='bx bx-check'></i>
            </button>
          </section>

          <section class="rekap-banding-kategori-juara" data-id="${category.id}" data-rekap-id="${rekapBandingId}" data-kategori="${category.kategori_juara}">
            <section class="content-rekap-banding-kategori-juara">
              <div class="form-input basic-flex-reverse">
                <label>Nilai Banding: </label>
                <select id="nilai-banding-field" required="">
                  ${options.replace(`value="${existingRekap.value_banding}"`, `value="${existingRekap.value_banding}" selected`)}
                </select>
              </div>
              <div class="form-input basic-flex-reverse">
                <label>Rekap Banding: </label>
                <select id="rekap-banding-field" required="">
                  <option value="">Pilih Rekap Banding</option>
                  <option value="none" ${existingRekap.rakap_banding === 'none' ? 'selected' : ''}>None</option>
                  <option value="utama" ${existingRekap.rakap_banding === 'utama' ? 'selected' : ''}>Nilai Utama</option>
                  <option value="umum" ${existingRekap.rakap_banding === 'umum' ? 'selected' : ''}>Nilai Umum</option>
                  <option value="point" ${existingRekap.rakap_banding === 'point' ? 'selected' : ''}>Point</option>
                  <option value="kategori" ${existingRekap.rakap_banding === 'kategori' ? 'selected' : ''}>Kategori</option>
                </select>
              </div>
              <div class="form-input basic-flex-reverse">
                <label>Set Value Banding: </label>
                <button type="button" class="toggle-button" value="${existingRekap.set_value_banding ? 'true' : 'false'}" onclick="toggleSetValueBanding(this)">
                  ${existingRekap.set_value_banding ? 'Active' : 'Non Active'}
                </button>
              </div>
              <div class="form-input basic-flex-reverse">
                <label>Tipe Penilaian: </label>
                <select id="tipe-penilai-field" required="">
                  <option value="">Pilih Tipe Penilaian</option>
                  <option value="mata lomba" ${existingRekap.tipe_penilaian_lomba === 'mata lomba' ? 'selected' : ''}>Mata Lomba</option>
                  <option value="kategori" ${existingRekap.tipe_penilaian_lomba === 'kategori' ? 'selected' : ''}>Kategori</option>
                </select>
              </div>
              <div class="form-input basic-flex-reverse">
                <label>Akumulasi Rekap: </label>
                <select id="tipe-penilai-field" required="">
                  <option value="">Pilih Akumulasi Rekap</option>
                  <option value="nilai" ${existingRekap.akumulasi_rekap_nilai === 'nilai' ? 'selected' : ''}>Nilai</option>
                  <option value="point" ${existingRekap.akumulasi_rekap_nilai === 'point' ? 'selected' : ''}>Point</option>
                </select>
              </div>

              <button type="button" onclick="addRekapBandingKategoriJuara(this, '${action}')">Simpan</button>
            </section>
          </section>

          <section class="content-sub-kategori-juara" data-id="${category.id}" data-kategori="${category.kategori_juara}">
          </section>
        </section>
        `;
      }).join('');

      const contentSideBar = data.map(category => {
        return `
          <div class="kategori-juara-header" kategori-juara-id="${category.id}" onclick="showRekapJuaraTb(this,${category.id})">
            <i class="bi bi-folder-fill"></i> <span>${category.kategori_juara}</span>
          </div>
        `;
      }).join('');

      categoriesContainer.innerHTML = contentSubPoint;
      document.getElementById('kategori-juara-list-menu').innerHTML = contentSideBar;
    }

    if (classifiedData) {
      let kategoriPenilaianText = ``;
      for (const namaLomba in classifiedData) {
        kategoriPenilaianText += `<tr class="header-kategori-point"><td colspan="2">${namaLomba}</td></tr>`;
        classifiedData[namaLomba].forEach(item => {
          kategoriPenilaianText += `
            <tr>
              <td>${item.nama_kategori}</td> 
              <td><button lomba-id="${item.lomba_id}" kategri-penilaian-id="${item.kategori_id}" onclick="addKategoriPenilaianJuara(this,'add')"><i class="fa fa-plus"></i></button></td>
            </tr>`;
        });
      }
      document.querySelector(`#point-penilaian-juara-list tbody`).innerHTML = kategoriPenilaianText;
    }

  } catch (error) {
    console.error("Error loading categories:", error);
  }
}



function checkKategoriJuara(el) {
  document.querySelectorAll('.kateori-point-juara').forEach(element => {
    element.classList.remove('active')
  });

  el.closest('.kateori-point-juara').classList.add('active')
}

async function addKategoriPenilaianJuara(el, act) {
  // Mengambil nilai dari input form
  if (act == 'add') {
    idlomba = Number(el.getAttribute('lomba-id'))
    kategoriJuaraId = Number(document.querySelector('.kateori-point-juara.active').getAttribute('data-id'))
    kategoriPenilaianId = Number(el.getAttribute('kategri-penilaian-id'))
  }

  if (act == 'delete') {
    idlomba = Number(el.closest('.point-penilaian-juara').getAttribute('lomba-id'))
    kategoriJuaraId = Number(el.closest('.point-penilaian-juara').getAttribute('kategri-juara-id'))
    kategoriPenilaianId = Number(el.closest('.point-penilaian-juara').getAttribute('kategri-penilaian-id'))
  }
  // Validasi jika kategori juara kosong
  if (!kategoriPenilaianId) {
    Swal.fire(
      'Tunggu Sebentar!',
      'Harap masukkan pilih kategori juara!',
      'warning'
    );
    return false;
  }


  // Langsung jalankan AJAX tanpa konfirmasi SweetAlert
  let infoSwal = `<span>Kategori Juara : <b> ${kategoriJuaraId} </b></span><br>`;
  let iconSwal = `<i class="fa fa-plus"></i>`;

  $.ajax({
    url: 'updateKategoriPenilaianJuara',  // Endpoint untuk menyimpan data
    type: 'POST',
    dataType: "JSON",
    data: {
      kategori_juara_id: kategoriJuaraId,
      kategori_penilaian_id: kategoriPenilaianId,
      lomba_id: idlomba,
      act: act,
    },
    beforeSend: function () {
      openLoader();
    },
    success: function (data) {
      if (data == "success") {
        Swal.fire({
          title: '<strong>Berhasil</strong>',
          icon: 'success',
          html: `Berhasil ${act} kategori juara! <br><br>` + infoSwal,
          timer: 500, // menutup setelah 0.5 detik
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          title: '<strong>Perhatian!</strong>',
          icon: 'warning',
          html: `Gagal ${act} kategori juara! <br><br>` + infoSwal,
          timer: 1000, // menutup setelah 1 detik
          showConfirmButton: false
        });
      }
    },
    complete: async function () {
      await setKategoriPenilaianJuara()
      closeLoader();
    }
  });
}

async function setKategoriPenilaianJuara() {
  const response = await fetch('/loadKategoriPenilaianJuara', {
    method: 'POST'
  });
  const result = await response.json();
  const data = result.data || [];


  document.querySelectorAll('.kateori-point-juara .content-sub-kategori-juara').forEach(element => {
    element.innerHTML = ''
  });
  if (data) {
    data.forEach(item => {
      document.querySelector(`.kateori-point-juara[data-id="${item.kategori_juara_id}"] .content-sub-kategori-juara`).innerHTML += `<button lomba-id="${item.lomba_id}" kategri-penilaian-id="${item.kategori_penilaian_id}" kategri-juara-id="${item.kategori_juara_id}" class="point-penilaian-juara"><span>${item.nama_kategori_penilaian} </span> <i onclick="addKategoriPenilaianJuara(this,'delete')" class="bi bi-x-lg"></i></button>`
    });
  }
}

async function printLembarJuaraModal(el, act) {
  openLoader()
  if (act == 'view') {

    const clonedCanvasMain = document.querySelector('#form-lembar-jawaban .canvas-content').cloneNode(true)
    document.getElementById('form-lembar-jawaban-temp').innerHTML = ''
    document.getElementById('form-lembar-jawaban-temp').appendChild(clonedCanvasMain)
    // SET WRAP PRINT SECTION
    const sectionMainContent = document.querySelector('#modal-content-lembar-juara-print .modal-content')
    const wrapContentPrintPreview = document.querySelector('#wrap-content-print-preview')
    if (wrapContentPrintPreview) {
      wrapContentPrintPreview.remove()
    }
    sectionMainContent.innerHTML += '<section id="wrap-content-print-preview"></section>'

    // SET VARIABEL VALUE TO PRINT
    const wrapContentPrint = sectionMainContent.querySelector('#wrap-content-print-preview')
    const wrapFormPrint = sectionMainContent.querySelector('#form-lembar-jawaban-temp')

    const tabelJuara = document.querySelector('#tabel-rekap-juara-lomba').cloneNode(true)
    wrapFormPrint.querySelector('#wrap-tabel-juara-print').appendChild(tabelJuara)
    totalJuaraHeader = document.getElementById('header-total-juara')
    kategoriJuaraHeader = document.querySelector('.kategori-juara-header.active span')

    wrapContentPrint.setAttribute('title-text', `Kategori ${kategoriJuaraHeader.textContent}`)
    wrapFormPrint.querySelector('#total-juara-print').textContent = `Total Juara : ${totalJuaraHeader.textContent}`
    wrapFormPrint.querySelector('#kategori-juara-print').textContent = `Kategori: ${kategoriJuaraHeader.textContent}`
    wrapFormPrint.querySelectorAll('.rekap-overall-rank-juara span').forEach(element => {
      element.remove()
    });


    // CLONE CANVAS AND APPEND
    const clonedCanvas = document.querySelector('#form-lembar-jawaban-temp .canvas-content').cloneNode(true)
    wrapContentPrint.appendChild(clonedCanvas)

    openModal("#modal-content-lembar-juara-print")
    closeLoader()
  }


  if (act == 'print') {
    docName = document.querySelector('#wrap-content-print-preview').getAttribute('title-text')
    canvasHeight = 592 + 3
    canvasWidth = 837 + 3

    await generateHtmlToPdf('wrap-content-print-preview', {
      pdfWidth: canvasWidth + 27,
      pdfHeight: canvasHeight + 30,
      canvasName: 'page-canvas',
      canvasType: 'L',
      fileType: 'filePdf',
      fileName: docName,
      cssOptions: {
        "*": {
          "font-family": "'PT Sans', sans-serif",
          "color": "black",
          "font-size": "8px"
        },
        ".title-text": {
          "font-size": "14px",
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
        ".main-rank td": {
          "background": "#2200b8",
          "color": "white"
        },
        "tbody .rekap-rank-lomba.rank-1, tbody .rekap-point-lomba.rank-1": {
          "background": "#47bb8e",
          "color": "white"
        },
        "tbody .rekap-rank-lomba.rank-2, tbody .rekap-point-lomba.rank-2": {
          "background": "#1e96fc",
          "color": "white"
        },
        "tbody .rekap-rank-lomba.rank-3, tbody .rekap-point-lomba.rank-3": {
          "background": "#fcbf49",
          "color": "white"
        },
        "tbody .col-value-lomba, tbody .col-total-nilai, tbody .col-rank, tbody .rekap-nilai-lomba, tbody .rekap-rank-lomba, tbody .rekap-point-lomba, tbody .rekap-total-rank-points, tbody .rekap-total-points-banding, tbody .rekap-overall-rank-juara": {
          "text-align": "center"
        },
        "tbody .col-kategori-penilaian, tbody .col-nilai-pinalti-lomba": {
          "text-align": "center"
        },
        "tbody .col-sub-total, tbody .col-nilai-pinalti, tbody .col-total-akhir": {
          "text-align": "center"
        }
      }

    });

    closeLoader()
  }
}
function printExcelSalesList(el, tableName) {
  // CLONE TABEL YANG AKAN DICETAK
  const tableContent = $("#" + tableName).clone()
  const wrapTablePrint = $('#wrap-tabel-print table')
  const tableTbody = wrapTablePrint.find('tbody')
  const tableThead = wrapTablePrint.find('thead')

  // BERSIHKAN TABEL PRINT
  tableThead.empty()
  tableTbody.empty()

  // CLONE THEAD & TBODY
  const theadContent = tableContent.find("thead").clone()
  const tbodyContent = tableContent.find("tbody").clone()

  tableThead.append(theadContent.children()) // hanya isi thead
  tableTbody.append(tbodyContent.children()) // hanya isi tbody

  // GAYA UNTUK TABEL EXPORT
  tableTbody.find('td').css({
    "vertical-align": "middle",
    "font-size": "16px"
  })

  tableTbody.find('.center-text').css({
    "text-align": "center"
  })

  wrapTablePrint.find('.no-border').css('border', '0')

  // EXPORT KE EXCEL
  const textNameFile = `Rekap Progress`
  exportToExcel(wrapTablePrint.attr('id'), textNameFile)
}
document.getElementById('toggleBtn').addEventListener('click', function () {
  var sidebar = document.getElementById('mainSidebar')
  sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none'
})

function sidebarMobileRekap() {
  sidebarMenu = document.querySelector('#wrap-rekap-juara .sidebar')
  sidebarMenu.classList.toggle('active')
}

function submitKuesioner() {
  const isi = $('#kuesioner-rekap').val().trim()

  if (isi === "") {
    Swal.fire({
      title: 'Perhatian!',
      text: 'Silakan isi kesan, pesan, dan saran terlebih dahulu.',
      icon: 'warning',
      confirmButtonText: 'OK'
    })
    return
  }

  $.ajax({
    url: 'saveKuesioner',
    type: 'POST',
    dataType: "JSON",
    data: {
      isi_kuesioner: isi
    },
    beforeSend: function () {
      openLoader()
    },
    success: function (data) {
      if (data === "success") {
        Swal.fire({
          title: '<strong>Terima Kasih!</strong>',
          icon: 'success',
          html: `Kuesioner berhasil dikirim!`,
          timer: 1500,
          showConfirmButton: false
        })

        $('#kuesioner-rekap').val('')
        closeModal()
      } else {
        Swal.fire({
          title: '<strong>Oops!</strong>',
          icon: 'error',
          html: `Kuesioner gagal dikirim. Coba lagi ya kak.`,
          timer: 1500,
          showConfirmButton: false
        })
      }
    },
    error: function () {
      Swal.fire({
        title: '<strong>Error!</strong>',
        icon: 'error',
        html: `Terjadi kesalahan saat mengirim kuesioner.`,
        timer: 1500,
        showConfirmButton: false
      })
    },
    complete: function () {
      closeLoader()
    }
  })
}


async function addRekapBandingKategoriJuara(el, act) {
  if (act !== 'add' && act !== 'update') {
    console.error("Action not allowed:", act);
    return;
  }

  const section = el.closest('.rekap-banding-kategori-juara');
  const kategoriJuaraId = Number(section.getAttribute('data-id'));
  const rekapBandingId = section.getAttribute('data-rekap-id') || ''; // Ambil id rekap_banding
  const valueBanding = Number(section.querySelector('#nilai-banding-field').value);
  const rakapBanding = section.querySelector('#rekap-banding-field').value;
  const tipePenilaian = section.querySelector('#tipe-penilai-field').value;
  const akumulasiRekap = section.querySelectorAll('#tipe-penilai-field')[1].value;
  const setValueButton = section.querySelector('.toggle-button');
  const setValueBanding = setValueButton.getAttribute('value');

  if ( !rakapBanding || !tipePenilaian || !akumulasiRekap) {
    Swal.fire(
      'Tunggu Sebentar!',
      'Harap lengkapi semua isian sebelum menyimpan!',
      'warning'
    );
    return false;
  }

  const formData = new FormData();
  formData.append('kategori_juara_id', kategoriJuaraId);
  formData.append('value_banding', valueBanding);
  formData.append('rakap_banding', rakapBanding);
  formData.append('set_value_banding', setValueBanding);
  formData.append('tipe_penilaian_lomba', tipePenilaian);
  formData.append('akumulasi_rekap_nilai', akumulasiRekap);
  formData.append('act', act);

  if (act === 'update' && rekapBandingId) {
    formData.append('id', rekapBandingId); // kirim ID kalau update
  }

  try {
    openLoader();

    const response = await fetch('updateRekapBandingKategoriJuara', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();

    let infoSwal = `<span>Kategori Juara : <b> ${kategoriJuaraId} </b></span><br>`;

    if (result.result === "success") {
      Swal.fire({
        title: '<strong>Berhasil</strong>',
        icon: 'success',
        html: `Berhasil ${act} rekap banding kategori juara! <br><br>` + infoSwal,
        timer: 800,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        title: '<strong>Perhatian!</strong>',
        icon: 'warning',
        html: `Gagal ${act} rekap banding kategori juara! <br><br>` + infoSwal,
        timer: 1200,
        showConfirmButton: false
      });
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    Swal.fire({
      title: '<strong>Gagal!</strong>',
      icon: 'error',
      html: 'Terjadi kesalahan saat menghubungi server!',
      timer: 1500,
      showConfirmButton: false
    });
  } finally {
    closeLoader();
  }
}



function toggleSetValueBanding(button) {
  // Ambil value saat ini
  const currentValue = button.getAttribute('value');

  // Toggle value
  if (currentValue === "false") {
    button.setAttribute('value', "true");
    button.textContent = "Active";
    button.classList.add('active-button'); // Optional: kasih style aktif
  } else {
    button.setAttribute('value', "false");
    button.textContent = "Non Active";
    button.classList.remove('active-button'); // Optional: hapus style aktif
  }
}


async function loadRekapBandingData() {
  try {
    let response = await fetch('/loadRekapBandingKategoriJuara', { method: 'POST' });
    let result = await response.json();

    if (result.status === "success" && Array.isArray(result.data)) {
      rekapBanding = result.data; // <-- update global variable
    } else {
      console.warn('Failed load rekapBanding from server.');
      rekapBanding = []; // kalau error kosongkan
    }
  } catch (error) {
    console.error('Error loading rekapBanding:', error);
    rekapBanding = []; // kalau error kosongkan
  }
}

function addLembarJuri() {
  openModal('#modal-upload-lembar-juri')
}
/// State
selectedFiles = [];
cameraStream = null;
usingBackCamera = true;
capturedBlob = null;
videoTrack = null;
imageCapture = null;
torchOn = false;

// DOM Elements
fileInput = document.getElementById('penilaian_foto');
previewContainer = document.getElementById('preview');
cameraVideo = document.getElementById('camera');
snapshotImage = document.getElementById('cameraSnapshot');
addToUploadButton = document.getElementById('addToUploadBtn');
retakeButton = document.getElementById('retakeBtn');
cameraSection = document.getElementById('camera-container');
uploadStatus = document.getElementById('uploadStatus');
pesertaIdInput = document.getElementById('peserta_id');
lombaIdInput = document.getElementById('lomba_id');
flashBtn = document.getElementById('flashBtn');

// Render file preview
function renderFilePreview(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const previewBox = document.createElement('div');
    previewBox.className = 'preview-item';
    previewBox.innerHTML = `
      <img src="${e.target.result}">
      <button class="remove-preview">×</button>
    `;
    previewBox.querySelector('button').onclick = () => {
      selectedFiles = selectedFiles.filter(f => f !== file);
      previewBox.remove();
    };
    previewContainer.appendChild(previewBox);
  };
  reader.readAsDataURL(file);
}

// Handle file input
fileInput.onchange = () => {
  [...fileInput.files].forEach(file => {
    if (file.size > 6 * 1024 * 1024) return alert(`${file.name} terlalu besar (>6MB)`);
    if (!selectedFiles.includes(file)) {
      selectedFiles.push(file);
      renderFilePreview(file);
    }
  });
  fileInput.value = '';
};

// Start camera
async function startCamera() {
  stopCamera();

  try {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const baseFacing = usingBackCamera ? 'environment' : 'user';

    // 👉 Gunakan resolusi medium (1280x720) di HP, default di desktop
    const preferredConstraints = isMobile
      ? {
        video: {
          facingMode: baseFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }
      : {
        video: { facingMode: baseFacing }
      };

    const fallbackConstraints = {
      video: { facingMode: baseFacing }
    };

    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
      console.log("Kamera dibuka dengan resolusi ideal 1280x720.");
    } catch (err) {
      console.warn("Fallback ke resolusi default:", err);
      stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
    }

    cameraStream = stream;
    cameraVideo.srcObject = stream;

    videoTrack = stream.getVideoTracks()[0];
    if ('ImageCapture' in window) {
      imageCapture = new ImageCapture(videoTrack);
    }

    // Tampilkan antarmuka
    cameraSection.style.display = 'block';
    cameraVideo.style.display = 'block';
    snapshotImage.style.display = 'none';
    addToUploadButton.style.display = 'none';
    document.getElementById('applyEffectBtn').style.display = 'none';
    retakeButton.style.display = 'none';
    document.querySelector('.control-row').style.display = 'flex';
    document.querySelector('#preview').style.display = 'none';

    cameraVideo.onloadedmetadata = () => {
      cameraVideo.play();

      const actualWidth = cameraVideo.videoWidth;
      const actualHeight = cameraVideo.videoHeight;
      console.log(`Resolusi kamera: ${actualWidth} x ${actualHeight}`);

      // Sesuaikan ukuran canvas dengan video
      const canvas = document.getElementById('cameraCanvas');
      if (canvas) {
        canvas.width = actualWidth;
        canvas.height = actualHeight;
        console.log(`Canvas diset: ${canvas.width} x ${canvas.height}`);
      }

      // Opsional: beri tahu user jika resolusi rendah
      if (actualWidth < 720) {
        alert("Kamera Anda menggunakan resolusi rendah. Hasil foto mungkin kurang tajam.");
      }
    };

  } catch (error) {
    alert('Tidak dapat mengakses kamera: ' + error.message);
    console.error(error);
  }
}


// Stop camera
function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
    videoTrack = null;
    imageCapture = null;
    torchOn = false;
  }
  cameraVideo.srcObject = null;
  cameraVideo.style.display = 'none';
  document.querySelector('.control-row').style.display = 'none';
}

// Switch camera
function switchCamera() {
  usingBackCamera = !usingBackCamera;
  startCamera();
}

// Toggle Flash
async function toggleFlash() {
  if (!videoTrack) {
    alert('Kamera belum aktif');
    return;
  }

  const capabilities = videoTrack.getCapabilities();
  if (!capabilities.torch) {
    alert('Perangkat ini tidak mendukung flash');
    return;
  }

  try {
    torchOn = !torchOn;
    await videoTrack.applyConstraints({ advanced: [{ torch: torchOn }] });
    flashBtn.innerText = torchOn ? 'Flash ON' : 'Flash OFF';
  } catch (e) {
    console.error('Gagal mengubah flash:', e);
    alert('Gagal mengubah status flash');
  }
}

// Hubungkan tombol flash
flashBtn.addEventListener('click', toggleFlash);

// Capture photo
capturedCanvas = null;
capturedCtx = null;

document.getElementById('captureBtn').onclick = () => {
  const scale = 2;
  const MAX_SIZE_MB = 3;

  const canvas = document.createElement('canvas');
  canvas.width = cameraVideo.videoWidth * scale;
  canvas.height = cameraVideo.videoHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    cameraVideo,
    0, 0, cameraVideo.videoWidth, cameraVideo.videoHeight,
    0, 0, canvas.width, canvas.height
  );

  capturedCanvas = canvas;
  capturedCtx = ctx;

  // Kompresi iteratif sampai ukuran <= 3MB
  compressToMaxSize(canvas, MAX_SIZE_MB * 1024 * 1024).then(blob => {
    console.log(`Final size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    capturedBlob = blob;

    snapshotImage.src = URL.createObjectURL(blob);
    snapshotImage.style.display = 'block';
    addToUploadButton.style.display = 'inline-block';
    retakeButton.style.display = 'inline-block';
    document.getElementById('applyEffectBtn').style.display = 'inline-block';
    stopCamera();
  });
};
// document.getElementById('captureBtn').onclick = () => {
//   const canvas = document.createElement('canvas');
//   canvas.width = cameraVideo.videoWidth;
//   canvas.height = cameraVideo.videoHeight;
//   const ctx = canvas.getContext('2d');
//   ctx.drawImage(cameraVideo, 0, 0);

//   // Simpan canvas dan context untuk pemrosesan nanti
//   capturedCanvas = canvas;
//   capturedCtx = ctx;

//   canvas.toBlob(blob => {
//     capturedBlob = blob;
//     snapshotImage.src = URL.createObjectURL(blob);
//     snapshotImage.style.display = 'block';
//     addToUploadButton.style.display = 'inline-block';
//     retakeButton.style.display = 'inline-block';
//     document.getElementById('applyEffectBtn').style.display = 'inline-block';
//     stopCamera();
//   }, 'image/jpeg', 0.85);
// };
async function compressToMaxSize(canvas, maxBytes) {
  let quality = 1.0;

  return new Promise(resolve => {
    function tryCompress() {
      canvas.toBlob(blob => {
        if (blob.size <= maxBytes || quality < 0.1) {
          resolve(blob);
        } else {
          quality -= 0.05;
          canvas.toBlob(newBlob => {
            if (newBlob.size <= maxBytes || quality < 0.1) {
              resolve(newBlob);
            } else {
              tryCompress(); // repeat
            }
          }, 'image/jpeg', quality);
        }
      }, 'image/jpeg', quality);
    }
    tryCompress();
  });
}


function applySmartScannerEffect(canvas, ctx) {
  if (!canvas || !ctx) {
    console.error("Canvas atau context tidak tersedia.");
    return;
  }

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Parameter efek
    const brightnessBoost = 12;
    const contrast = 1.08;
    const softRange = 50;
    const minValue = 80;
    const maxValue = 255;
    const blockHeight = 16;

    const blocks = Math.ceil(height / blockHeight);
    const blockAverages = new Array(blocks).fill(0);
    const blockCounts = new Array(blocks).fill(0);

    // Step 1: Hitung average gray tiap blok vertikal
    for (let y = 0; y < height; y++) {
      const blockIndex = Math.floor(y / blockHeight);
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        blockAverages[blockIndex] += gray;
        blockCounts[blockIndex]++;
      }
    }

    for (let i = 0; i < blocks; i++) {
      if (blockCounts[i] > 0) {
        blockAverages[i] /= blockCounts[i];
      }
    }

    // Step 2: Terapkan efek per piksel berdasarkan blok
    for (let y = 0; y < height; y++) {
      const blockIndex = Math.floor(y / blockHeight);
      const avgGray = blockAverages[blockIndex];

      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        let g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        g = g * contrast + brightnessBoost;

        let result;
        if (g >= avgGray + softRange) {
          result = maxValue;
        } else if (g >= avgGray - softRange) {
          const t = (g - (avgGray - softRange)) / (softRange * 2);
          result = minValue + t * (maxValue - minValue);
        } else {
          result = minValue;
        }

        // ✨ Clean-up: Hilangkan bayangan samar
        if (result > 180 && result < 230) {
          result += 20;
        }

        const final = Math.round(Math.min(255, Math.max(0, result)));
        data[i] = data[i + 1] = data[i + 2] = final;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  } catch (e) {
    console.error("Gagal memproses efek scan:", e);
  }
}
function applyScannerEffectWithColorCleaned(canvas, ctx) {
  if (!canvas || !ctx) {
    console.error("Canvas atau context tidak tersedia.");
    return;
  }

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const brightnessBoost = 12;
    const contrast = 1.08;
    const softRange = 50;
    const blockHeight = 16;

    const blocks = Math.ceil(height / blockHeight);
    const blockAverages = new Array(blocks).fill(0);
    const blockCounts = new Array(blocks).fill(0);

    // Step 1: Hitung rata-rata gray per blok
    for (let y = 0; y < height; y++) {
      const blockIndex = Math.floor(y / blockHeight);
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        blockAverages[blockIndex] += gray;
        blockCounts[blockIndex]++;
      }
    }

    for (let i = 0; i < blocks; i++) {
      if (blockCounts[i]) blockAverages[i] /= blockCounts[i];
    }

    // Step 2: Terapkan efek dan pembersihan
    for (let y = 0; y < height; y++) {
      const blockIndex = Math.floor(y / blockHeight);
      const avgGray = blockAverages[blockIndex];

      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const boostedGray = gray * contrast + brightnessBoost;

        let strength;
        if (boostedGray >= avgGray + softRange) {
          strength = 1;
        } else if (boostedGray >= avgGray - softRange) {
          const t = (boostedGray - (avgGray - softRange)) / (softRange * 2);
          strength = t;
        } else {
          strength = 0;
        }

        // Pencerahan latar, pertahankan warna teks
        data[i] = r + (255 - r) * strength;
        data[i + 1] = g + (255 - g) * strength;
        data[i + 2] = b + (255 - b) * strength;

        // ✨ Penyesuaian ekstra:
        // 1. Kurangi dominasi kuning (highlight)
        if (r > 200 && g > 190 && b < 150) {
          data[i] = 240;
          data[i + 1] = 240;
          data[i + 2] = 240;
        }

        // 2. Pertajam garis abu tipis jadi lebih gelap
        if (gray < 120 && gray > 90) {
          data[i] *= 0.9;
          data[i + 1] *= 0.9;
          data[i + 2] *= 0.9;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  } catch (e) {
    console.error("Gagal memproses efek warna bersih:", e);
  }
}


document.getElementById('applyEffectBtn').onclick = () => {
  if (!capturedCanvas || !capturedCtx) {
    alert('Belum ada gambar untuk diberi efek.');
    return;
  }

  applyScannerEffectWithColorCleaned(capturedCanvas, capturedCtx);

  capturedCanvas.toBlob(blob => {
    capturedBlob = blob;
    snapshotImage.src = URL.createObjectURL(blob);
  }, 'image/jpeg', 0.9);
};



// Add captured photo to upload list
addToUploadButton.onclick = () => {
  if (!capturedBlob) return;
  const index = selectedFiles.length + 1;
  noPeserta = document.querySelector('#peserta-list-container .btn-peserta-lomba.active').getAttribute('data-no-peserta')
  namaLomba = document.querySelector('.lomba-header.active span').textContent
  lombaID = Number(document.querySelector('.lomba-header.active').getAttribute('data-no-peserta'))
  uniqueCode = generateUniqueCode();
  const fileName = `${noPeserta}-${namaLomba}-${uniqueCode}.jpg`;
  const file = new File([capturedBlob], fileName, { type: 'image/jpeg' });
  selectedFiles.push(file);
  renderFilePreview(file);
  capturedBlob = null;
  snapshotImage.style.display = 'none';
  addToUploadButton.style.display = 'none';
  document.getElementById('applyEffectBtn').style.display = 'none';
  retakeButton.style.display = 'none';
  cameraSection.style.display = 'none';
  document.querySelector('#preview').style.display = 'flex';
};

// Retake photo
retakeButton.onclick = () => {
  capturedBlob = null;
  snapshotImage.style.display = 'none';
  addToUploadButton.style.display = 'none';
  document.getElementById('applyEffectBtn').style.display = 'none';
  retakeButton.style.display = 'none';
  startCamera();
};

function uploadPenilaianFiles() {
  noPeserta = document.querySelector('#peserta-list-container .btn-peserta-lomba.active').getAttribute('data-no-peserta');
  namaLomba = document.querySelector('.lomba-header.active span').textContent.trim().replace(/\s+/g, '_');
  lombaID = Number(document.querySelector('.lomba-header.active').getAttribute('data-lomba-id'));
  if (!noPeserta || !namaLomba || !lombaID) {
    Swal.fire({
      icon: 'error',
      title: 'Data tidak lengkap',
      text: 'No Peserta, Nama Lomba, atau Lomba ID tidak ditemukan.',
    });
    return;
  }

  if (selectedFiles.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Tidak ada file',
      text: 'Pilih minimal 1 file untuk diupload.',
    });
    return;
  }

  const formData = new FormData();
  formData.append('no_peserta', noPeserta);
  formData.append('lomba_id', lombaID);

  selectedFiles.forEach((file) => {
    const ext = file.name.split('.').pop();
    const uniqueCode = generateUniqueCode();
    const newName = `${noPeserta}-${namaLomba}-${uniqueCode}.${ext}`;
    const renamedFile = new File([file], newName, { type: file.type });
    formData.append('penilaian_foto', renamedFile);
  });

  Swal.fire({
    title: 'Mengupload...',
    html: `<div id="upload-progress" style="width:100%;background:#eee;border-radius:4px;overflow:hidden;">
             <div id="upload-bar" style="height:16px;width:0%;background:#4b4fed;"></div>
           </div>
           <div id="upload-percent" style="margin-top:5px;font-size:14px;">0%</div>`,
    showConfirmButton: false,
    allowOutsideClick: false,
    didOpen: () => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/uploadPenilaian', true);

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          document.getElementById('upload-bar').style.width = percent + '%';
          document.getElementById('upload-percent').textContent = percent + '%';
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          if (data.result === 'success') {
            Swal.fire({
              icon: 'success',
              title: 'Upload berhasil!',
              html: `<b>${data.uploaded.length}</b> file berhasil diupload:<br><small>${data.uploaded.join('<br>')}</small>`,
            });
            previewContainer.innerHTML = '';
            selectedFiles = [];
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Upload gagal!',
              html: (data.failed || []).join('<br>') || 'Tidak diketahui penyebabnya.',
            });
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Gagal menghubungi server',
            text: `Kode status: ${xhr.status}`,
          });
        }
      };

      xhr.onerror = () => {
        Swal.fire({
          icon: 'error',
          title: 'Kesalahan Jaringan',
          text: 'Gagal mengirim file ke server.',
        });
      };

      xhr.send(formData);
    }
  });
}


function generateUniqueCode(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = Date.now().toString(); // Awali dengan timestamp
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function loadContentFoto() {
  
  noPeserta = document.querySelector('#peserta-list-container .btn-peserta-lomba.active').getAttribute('data-no-peserta');
  lombaID = Number(document.querySelector('.lomba-header.active').getAttribute('data-lomba-id'));
  const container = document.getElementById('foto-preview');
  
  if (!noPeserta || !lombaID || !container) {
    console.warn('❗ Data peserta/lomba atau container tidak ditemukan.');
    return;
  }
  
  const formData = new FormData();
  formData.append('no_peserta', noPeserta);
  formData.append('lomba_id', lombaID);
  
  try {
    const response = await fetch('/loadFotoPenilaian', {
      method: 'POST',
      body: formData
    });
  
    const result = await response.json();
    const fotoList = result.status === 'success' && Array.isArray(result.data) ? result.data : [];
  
    imgPreview =``
    if (fotoList.length === 0) {
      container.innerHTML = '<p style="color:gray">❕ Tidak ada foto ditemukan.</p>';
    } else {
      fotoList.forEach(item => {
        const pathParts = item.file_path.split('\\');
        const fileName = pathParts[3]; 
  
        imgPreview += `
          <div class="wrap-img-preview" data-id="${item.id}">
            <img src="${item.file_path}" alt="Foto ${item.no_peserta}">
            <div class="btn-img-preview">
              <a class="btn-download" href="${item.file_path}" download="${fileName}" style="text-decoration: none;">
                <i class="bi bi-download"></i> Download
              </a>
              <button class="btn-delete" onclick="deleteImg(this,${item.id})"><i class="bi bi-trash3-fill"></i></button>
            </div>
          </div>
        `;
      });
  
  
      container.innerHTML = imgPreview
    }
  
  
  
  } catch (error) {
    console.error('❌ Gagal memuat foto penilaian:', error);
    container.innerHTML = '<p style="color:red">Gagal memuat data dari server.</p>';
  }
}
async function previewFotoPenilaian() {
  await loadContentFoto()
  openModal('#modal-lampiran-lembar-juri');
}

function deleteImg(el, id) {
  Swal.fire({
    title: 'Hapus foto ini?',
    text: 'Foto akan dihapus permanen.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  }).then(result => {
    if (result.isConfirmed) {
      const formData = new FormData();
      formData.append('id', id);

      fetch('/deleteFotoPenilaian', {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            Swal.fire('Berhasil!', 'Foto telah dihapus.', 'success');
            loadContentFoto?.();
          } else {
            Swal.fire('Gagal', data.message || 'Foto tidak dapat dihapus.', 'error');
          }
        })
        .catch(() => {
          Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus.', 'error');
        });
    }
  });
}
async function setRekapJuaraPrint(dataLomba, kategorPenilaian, kategoriJuaraId) {
  let { kategoriLomba, mataLomba, peserta } = await getData();
  let { data: kategoripenilaianLists } = await fetch('/loadKategoriPenilaianAll', { method: 'POST' }).then(res => res.json());

  // 1. Struktur Data untuk Mempermudah Akses
  const kategoriMap = kategoriLomba.reduce((map, kat) => {
    map[kat.kategori_id] = { nama: kat.nama_kategori, lomba: [] };
    return map;
  }, {});

  mataLomba.forEach(lomba => kategoriMap[lomba.kategori_id]?.lomba.push(lomba));
  // 2. Generate Header Tabel
  thead = document.querySelector(`.tabel-rekap-juara-lomba-print[kategori-juara-id="${kategoriJuaraId}"] thead`);
  tbody = document.querySelector(`.tabel-rekap-juara-lomba-print[kategori-juara-id="${kategoriJuaraId}"] tbody`);

  kategoriJuaraId = kategoriJuaraId
  datarekapBanding = rekapBanding.find(item => item.kategori_juara_id === Number(kategoriJuaraId));
  idPointBanding = datarekapBanding.value_banding;
  lombaId = idPointBanding
  if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'point' || datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'umum') {
    lomba = mataLomba.find(item => item.lomba_id === lombaId);
    namaLomba = lomba ? lomba.nama_lomba : "";
    filteredData = kategoripenilaianLists.filter(item => item.lomba_id === lombaId);
  } else if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'point' || datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'utama') {
    lomba = mataLomba.find(item => item.lomba_id === lombaId);
    namaLomba = lomba ? lomba.nama_lomba : "";
    filteredData = kategoripenilaianLists.filter(item => item.lomba_id === lombaId);
  } else if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'kategori') {
    filteredData = kategoripenilaianLists.filter(item => item.lomba_id === lombaId && item.nilai_banding === 'active');
    namaKategori = filteredData.map(item => item.nama_kategori);
    namaLomba = filteredData.map(item => item.nama_kategori).join(', ') || '';
  } else {
    namaLomba = ''
  }


  let headerKategori = "<tr><th rowspan='3'>Rank</th><th rowspan='3'>Predikat</th><th rowspan='3'>No Peserta</th><th rowspan='3'>Nama Pangkalan</th>";
  if (reguPeserta) headerKategori += `<th rowspan='3'>Regu</th>`;

  if (datarekapBanding.akumulasi_rekap_nilai == 'nilai') {

    colspanX = 1
  } else {
    if (dataLomba.length > 1) {
      colspanX = 3 * dataLomba.length;
    } else {
      colspanX = 1 * dataLomba.length;
    }
  }

  let headerLomba = "<tr>";
  Object.values(kategoriMap).forEach(kat => {
    headerKategori += `<th class="head-kategori-lomba" colspan="${colspanX}">${kat.nama}</th>`;
  });

  if (datarekapBanding.tipe_penilaian_lomba == 'kategori') {
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'point') {
      headerKategori += `<th rowspan='3'>Point Banding ${namaLomba}</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'utama') {
      headerKategori += `<th rowspan='3'>Nilai Banding</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'umum') {
      // headerKategori += `<th rowspan='3'>Nilai Banding ${namaLomba} Umum</th>`;
      headerKategori += `<th rowspan='3'>Nilai Banding ${namaLomba}</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'utama') {
      headerKategori += `<th rowspan='3'>Nilai Banding ${namaLomba} Utama</th>`;
    }
  }

  if (datarekapBanding.tipe_penilaian_lomba == 'mata lomba') {
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'point') {
      headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Point Banding ${namaLomba}</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'utama') {
      headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Nilai Banding ${namaLomba} Utama</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'kategori') {
      headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Nilai Banding ${namaLomba}</th>`;
    }
    if (datarekapBanding.set_value_banding == true && datarekapBanding.rakap_banding == 'umum') {
      if (filteredData.length > 1) {
        // headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Nilai Banding ${namaLomba} Umum</th>`;
        headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Nilai Banding ${namaLomba}</th>`;
      }
      if (filteredData.length == 1) {
        headerKategori += `<th rowspan='3'>Total Point</th> <th rowspan='3'>Nilai Banding ${namaLomba} </th>`;
      }
    }
    if (datarekapBanding.set_value_banding == false && datarekapBanding.akumulasi_rekap_nilai == 'point') {
      headerKategori += `<th rowspan='3'>Total Point</th>`;
    }
    if (datarekapBanding.set_value_banding == false && datarekapBanding.rakap_banding == 'utama' || datarekapBanding.set_value_banding == false && datarekapBanding.rakap_banding == 'umum') {
      headerKategori += ` <th rowspan='3'>Rank</th>`;
    }

  }

  if (datarekapBanding.akumulasi_rekap_nilai == 'nilai') {
    colspan = 'colspan="1"'
  } else {
    if (dataLomba.length > 1) {
      colspan = 'colspan="3"'
    }else{
      colspan = 'colspan="1"'
    }
  }

  if (datarekapBanding.tipe_penilaian_lomba === 'kategori') {
    dataLomba.forEach(lomba => {
      headerLomba += `<th ${colspan} lomba-id="${lomba.lomba_id}">Kategori (`;

      // Loop through the kategorPenilaian array to build category names
      kategorPenilaian.forEach((item, index) => {
        headerLomba += item.nama_kategori_penilaian;

        // Add the plus sign if it's not the last item
        if (index < kategorPenilaian.length - 1) {
          headerLomba += ' + ';
        }
      });

      headerLomba += `)</th>`;
    });
  }

  if (datarekapBanding.tipe_penilaian_lomba == 'mata lomba') {
    dataLomba.forEach(lomba => {
      headerLomba += `<th ${colspan} lomba-id="${lomba.lomba_id}">${lomba.nama_lomba}</th>`;
    });
  }


  if (datarekapBanding.akumulasi_rekap_nilai == 'nilai') {
    colspan = 'colspan="1"';
    headerLomba += `<tr>`
    dataLomba.forEach(lomba => {
      headerLomba += `<th>Nilai</th>`;
    });
  } else {
    headerLomba += `<tr>`
    if (dataLomba.length > 1){
      dataLomba.forEach(lomba => {
        headerLomba += `<th>Nilai</th><th>Rank</th><th>Point</th>`;
      });
      colspan = 'colspan="3"';
    }else{
      colspan = 'colspan="1"';
      headerLomba += `<th>Nilai</th>`;
      colspan = 'colspan="1"';
    }
  }


  thead.innerHTML = headerKategori + headerLomba;

  // 3. Urutkan dan Tentukan Rank Peserta
  peserta.sort((a, b) => a.no_peserta.localeCompare(b.no_peserta));

  setNilaiRekapJuaraPrint(kategoripenilaianLists, dataLomba, kategorPenilaian, kategoriJuaraId)
}
async function setNilaiRekapJuaraPrint(kategoripenilaianLists, dataLomba, kategorPenilaianJuara, kategoriJuaraId) {
  try {
    let { peserta } = await getData();
    const [rekapData, penguranganData] = await Promise.all([
      fetch('/loadNilaiRekap', { method: 'POST' }).then(res => res.json()).then(data => data.data || []),
      fetch('/loadPointPenguranganPeserta', { method: 'POST' }).then(res => res.json()).then(data => data.data || [])
    ]);

    // Jika kategoripenilaianLists kosong, beri array kosong sebagai fallback
    const categories = kategoripenilaianLists || [];
    const result = {};

    // Langkah 2: Memproses nilai dan mengategorikannya
    if (rekapData.length > 0) {
      rekapData.forEach(score => {
        const category = categories.find(cat => cat.kategori_id == score.kategori_penilaian_id);

        // console.log('score', score)
        if (category) {
          // Jika peserta belum ada dalam hasil, buat entri untuknya
          // console.log('category', category)
          if (!result[score.no_peserta]) {
            result[score.no_peserta] = {};
          }

          // Jika kategori lomba belum ada dalam hasil peserta, buat entri kategori
          if (!result[score.no_peserta][category.nama_kategori]) {
            result[score.no_peserta][category.nama_kategori] = {
              kategori_id: category.kategori_id,
              lomba_id: category.lomba_id,
              nilai_juri: 0,
              pengurangan_poin: 0,
              total_nilai: 0,
              set_nilai: category.set_nilai,
              nilai_banding: score.nilai_banding
            };
          }

          // Menambahkan nilai juri ke kategori yang sesuai
          result[score.no_peserta][category.nama_kategori].nilai_juri += score.total_nilai_juri;
        }
      });
    }
    // Langkah 3: Menerapkan penalti
    if (penguranganData.length > 0) {
      penguranganData.forEach(penalty => {
        const category = categories.find(cat => cat.kategori_id == penalty.kategori_id);

        if (category) {
          // Jika peserta dan kategori ada, kurangi nilai berdasarkan penalti
          if (result[penalty.no_peserta] && result[penalty.no_peserta][category.nama_kategori]) {
            result[penalty.no_peserta][category.nama_kategori].pengurangan_poin += penalty.point_pengurangan;
          }
        }
      });
    }

    // Langkah 4: Menghitung total nilai setelah penalti
    Object.keys(result).forEach(noPeserta => {
      Object.keys(result[noPeserta]).forEach(kategori => {
        const category = result[noPeserta][kategori];
        // Total nilai = nilai juri - pengurangan poin
        category.total_nilai = category.nilai_juri - category.pengurangan_poin;
      });
    });

    totalNilaiKategori = result;

    generalPinalti = calculateGeneralPinalti(penguranganData)
    hasil2 = akumulasiNilaiDenganBanding(totalNilaiKategori, kategorPenilaianJuara, kategoriJuaraId, 'printRekap', generalPinalti);
    dataRankLombaPoint = processAndRankPeserta(totalNilaiKategori, masterRank, generalPinalti);
    hasilAkumulasi = accumulatePoints(hasil2, dataRankLombaPoint, kategoriJuaraId, 'printRekap');

    resultRekapPoint = {};

    hasilAkumulasi.forEach(peserta => {
      resultRekapPoint[peserta.no_peserta] = {
        total_point: peserta.total_point,
        point_banding: peserta.point_banding,
        total_nilai_lomba: peserta.total_nilai_lomba,
        no_peserta: peserta.no_peserta,
        rekap_lomba: peserta.rekap_lomba,
        rank: peserta.rank
      };
    });

    let sortedRekapaJuaraPeserta = Object.entries(resultRekapPoint).map(([id, data]) => ({ id, ...data }));

    // Sort the array by 'rank'
    sortedRekapaJuaraPeserta.sort((a, b) => {
      if (a.rank == null && b.rank == null) return 0
      if (a.rank == null) return 1  // a di akhir
      if (b.rank == null) return -1 // b di akhir
      return a.rank - b.rank
    })

    // Mengecek jika sortedRekapaJuaraPeserta kosong, tampilkan pesan bahwa tidak ada data peserta
    if (sortedRekapaJuaraPeserta.length === 0) {
      document.querySelector('#tabel-rekap-juara-lomba tbody').innerHTML = `<tr><td colspan="100%">Belum ada data peserta</td></tr>`;
    } else {
      let no = 0;
      let rekapRow = '';

      const totalJuara = kategorPenilaianJuara?.[0]?.total_juara || 0;
      if (!kategoriJuaraId) {
        console.error('kategoriJuaraId tidak ditemukan atau tidak terdefinisi');
      }

      const rekapBandingSet = rekapBanding.find(item => item.kategori_juara_id === Number(kategoriJuaraId));

      let countJuara = 0;
      for (const details of sortedRekapaJuaraPeserta) {
        if (countJuara >= totalJuara) break;

        no++;
        noPeserta = details.no_peserta;
        namaPangkalan = peserta.find(item => item.no_peserta === noPeserta)?.nama_pangkalan || '';
        keteranganPredikat = masterRank.find(item => item.rank === details.rank)?.keterangan || 'Tidak Diketahui';
        let row = `<tr class="rank-${details.rank}"><td class="col-rank">${details.rank || ''}</td><td class="col-predikat">${keteranganPredikat || ''}</td><td class="col-no-peserta">${noPeserta}</td><td class="col-pangkalan">${namaPangkalan}</td>`;

        if (reguPeserta) row += `<td></td>`;

        dataLomba.forEach(lomba => {
          const lombaDetails = details.rekap_lomba.find(l => l.lomba_id === lomba.lomba_id);
          let nilai = '', rank = '', point = '', totalNilaiLomba = '';

          if (lombaDetails) {
            if (rekapBandingSet?.set_value_banding === false) {
              nilai = lombaDetails.total_nilai || 0;
            } else if (rekapBandingSet?.rakap_banding === 'point') {
              nilai = lombaDetails.total_nilai || 0;
              if (lombaDetails.total_nilai != 0 && lombaDetails.nilai_banding_kategori == 0) nilai = lombaDetails.total_nilai || '';
            } else {
              nilai = lombaDetails.total_nilai || 0;
            }

            rank = lombaDetails.rank || '';
            point = lombaDetails.points || '';
            totalNilaiLomba = lombaDetails.total_nilai || 0;

            if (rekapBandingSet?.akumulasi_rekap_nilai === 'nilai') {
              row += `<td class="rekap-nilai-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}">${totalNilaiLomba}</td>`;
            } else {


              if (dataLomba.length > 1) {
                row += `
                  <td class="rank-${rank} rekap-nilai-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}">${nilai}</td>
                  <td class="rank-${rank} rekap-rank-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}">${rank}</td>
                  <td class="rank-${rank} rekap-point-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}">${point}</td>
                `;

              } else {
                row += `
                  <td class="rank-${rank} rekap-nilai-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}">${nilai}</td>
                `;
              }
            }
          } else {
            if (dataLomba.length > 1) {
              row += `
                  <td class="rank-${rank} rekap-nilai-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}"></td>
                  <td class="rank-${rank} rekap-rank-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}"></td>
                  <td class="rank-${rank} rekap-point-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}"></td>
                `;

            } else {
              row += `
                  <td class="rank-${rank} rekap-nilai-lomba" no-peserta="${noPeserta}" lomba-id="${lomba.lomba_id}"></td>
                `;
            }
          }
        });

        let nilaiBanding = '';
        if (rekapBandingSet?.rakap_banding === 'point') {
          nilaiBanding = details.point_banding || '';
        } else {
          nilaiBanding = details.rekap_lomba?.[0]?.nilai_banding_kategori || '';
        }

        if (datarekapBanding.tipe_penilaian_lomba === 'mata lomba') {
          if (!datarekapBanding.set_value_banding) {
            row += `
          <td class="rank-utama${details.rank} rekap-total-rank-points">${details.total_point || ''}</td>
        `;
          } else {
            row += `
          <td class="rank-utama${details.rank} rekap-total-rank-points">${details.total_point || ''}</td>
          <td class="rank-utama${details.rank} rekap-total-points-banding">${nilaiBanding}</td>
        `;
          }
        } else if (datarekapBanding.tipe_penilaian_lomba === 'kategori') {
          if (!datarekapBanding.set_value_banding) {
          } else {
            row += `

          <td class="rank-utama${details.rank} rekap-total-points-banding">${nilaiBanding}</td>
        `;
          }
        }

        row += `</tr>`;
        rekapRow += row;
        countJuara++;
      }

      document.querySelector(`.tabel-rekap-juara-lomba-print[kategori-juara-id="${kategoriJuaraId}"] tbody`).innerHTML = rekapRow;

      // Tambahkan kelas 'main-rank' pada peringkat teratas
      for (let index = 0; index < totalJuara; index++) {
        const rowRanks = document.querySelectorAll(`.tabel-rekap-juara-lomba-print[kategori-juara-id="${kategoriJuaraId}"] tr.rank-${index + 1}`);
        rowRanks.forEach(row => {
          row.classList.add('main-rank');
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Terjadi kesalahan saat memproses data rekap juara.');
  }
}

async function loadPrintRekapJuara() {
  try {
    // Ambil semua data paralel
    const [kategoriRes, rekapRes, penilaianRes, kategoriPenilaianJuaraRes] = await Promise.all([
      fetch('/loadKategoriJuara', { method: 'POST' }),
      fetch('/loadRekapBandingKategoriJuara', { method: 'POST' }),
      fetch('/loadKategoriPenilaianAll', { method: 'POST' }),
      fetch('/loadKategoriPenilaianJuara', { method: 'GET' })
    ]);

    const [kategoriList, rekapList, penilaianList, kategoriPenilaianJuaraList] = await Promise.all([
      kategoriRes.json(),
      rekapRes.json(),
      penilaianRes.json(),
      kategoriPenilaianJuaraRes.json()
    ]).then(results => results.map(r => r.data || []));

    // Siapkan struktur kategoriJuaraMap
    const kategoriJuaraMap = new Map();
    const seenKeys = new Set();

    for (const { kategori_juara, lomba_id, kategori_juara_id } of kategoriPenilaianJuaraList) {
      const uniqueKey = `${kategori_juara}_${lomba_id}`;
      if (seenKeys.has(uniqueKey)) continue;
      seenKeys.add(uniqueKey);

      if (!kategoriJuaraMap.has(kategori_juara)) {
        kategoriJuaraMap.set(kategori_juara, []);
      }
      kategoriJuaraMap.get(kategori_juara).push({ lomba_id, kategori_juara_id });
    }

    // Bangun list kategori_juara unik
    const kategoriJuaraList = Array.from(kategoriJuaraMap.entries()).map(([kategori, entries]) => {
      const id = entries[0].kategori_juara_id;
      const lomba_id = entries.length === 1 ? entries[0].lomba_id : "0";
      return { kategori_juara: kategori, id, lomba_id };
    }).sort((a, b) => parseInt(a.lomba_id, 10) - parseInt(b.lomba_id, 10));

    // Buat grup penilaian berdasarkan nama_lomba
    const groupedPenilaian = penilaianList.reduce((acc, item) => {
      (acc[item.nama_lomba] ||= []).push(item);
      return acc;
    }, {});

    // Ambil mata lomba
    const { mataLomba } = await getData();
    const wrapper = document.querySelector('#wrap-content-rekap-juara-lomba-print');
    wrapper.innerHTML = ''; // Bersihkan sebelum render ulang

    for (const category of kategoriJuaraList) {
      const formData = new FormData();
      formData.append('kategori_juara_id', category.id);

      const response = await fetch('/loadKategoriPenilaianJuara', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`Gagal memuat kategori penilaian juara untuk kategori: ${category.kategori_juara}`);

      const { data = [] } = await response.json();

      // Dapatkan lomba unik berdasarkan nama
      const lombaData = [...new Map(data.map(item => [item.nama_lomba, {
        lomba_id: item.lomba_id,
        nama_lomba: item.nama_lomba
      }])).values()];

      // Render Section
      const sectionHTML = `
        <section class="clone-content-print" style="margin-top:0.5rem; border-bottom: 4px solid black; padding-bottom: 1rem;">
          <h3>${category.kategori_juara}</h3>
          <table class="tabel-rekap-juara-lomba-print" kategori-juara-id="${category.id}">
            <thead></thead>
            <tbody></tbody>
          </table>
        </section>`;
      wrapper.insertAdjacentHTML('beforeend', sectionHTML);

      // Tampilkan rekap
      await setRekapJuaraPrint(lombaData, data, category.id);
    }

  } catch (error) {
    console.error('Terjadi kesalahan saat memuat data:', error.message);
    alert('Terjadi kesalahan saat memuat data.');
  }
}

async function lembarJuaraPreviewModal(el, act) {
  openLoader();

  if (act === 'view') {
    modalID = 'modal-content-report-juara-print';
    formMain = document.querySelector(`#${modalID} #form-lampiran-predikat-juara`);
    formTemp = document.querySelector(`#${modalID} #form-lampiran-predikat-juara-temp`);
    sectionMainContent = document.querySelector(`#${modalID} .modal-content`);
    existingPreview = sectionMainContent.querySelector('#wrap-content-print-preview');
    if (existingPreview) existingPreview.remove();
    sectionMainContent.innerHTML += '<section id="wrap-content-print-preview"></section>'

    // ✅ Tunggu fungsi ini selesai sepenuhnya
    await loadPrintRekapJuara();


    wrapContentPrint = sectionMainContent.querySelector(`#wrap-content-print-preview`);
    wrapFormPrint = sectionMainContent.querySelector('#form-lampiran-predikat-juara');

    clonedCanvas = formMain.querySelector('.canvas-content').cloneNode(true);
    wrapContentPrint.innerHTML = '';
    wrapContentPrint.appendChild(clonedCanvas);

    let conetentPrintCanvasLast = document.querySelectorAll(`#wrap-content-print-preview .canvas-content:last-child .clone-content-print`)
    conetentPrintCanvasLast.forEach(content => { content.remove() });

    // Tunggu proses penggandaan dan pengecekan tinggi halaman
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        let contentPrintSection = document.querySelectorAll('#form-lampiran-predikat-juara .canvas-content .clone-content-print');

        contentPrintSection.forEach(element => {
          cloneContent = element.cloneNode(true);
          let canvasLastPrint = document.querySelector(`#wrap-content-print-preview .canvas-content:last-child`);
          let currentHeight = canvasLastPrint.querySelector('.box-content-print').offsetHeight;
          const maxHeight = 470;
          if (currentHeight > maxHeight) {
            const canvasClone = document.querySelector('#wrap-content-print-preview .canvas-content:first-child').cloneNode(true);
            document.querySelector('#wrap-content-print-preview').appendChild(canvasClone);
            const newContentPrintCanvasLast = document.querySelectorAll(`#wrap-content-print-preview .canvas-content:last-child .clone-content-print`);
            newContentPrintCanvasLast.forEach(content => content.remove());
          }

          document.querySelector(`#wrap-content-print-preview .canvas-content:last-child .box-content-print`).appendChild(cloneContent);

          if (element.classList.contains('box-table')) {
            let tableContent = element.querySelector('table');
            const idTable = tableContent.getAttribute('id');
            const tableName = idTable;

            if (tableName) {
              let tableContentPreview = document.querySelector(`#wrap-content-print-preview .canvas-content:last-child .${tableName} tbody`);
              tableContent = wrapFormPrint.querySelector(`#${tableName}`);
              tableContentPreview.innerHTML = '';
              tableContent.querySelectorAll('tbody tr').forEach(tr => {
                canvasLastPrint = document.querySelector(`#wrap-content-print-preview .canvas-content:last-child`);
                currentHeight = canvasLastPrint.querySelector('.box-content-print').offsetHeight;

                if (tableContentPreview.querySelectorAll('tr').length >= 22) {
                  const canvasClone = document.querySelector('#wrap-content-print-preview .canvas-content:first-child').cloneNode(true);
                  document.querySelector('#wrap-content-print-preview').appendChild(canvasClone);

                  canvasLastPrint = document.querySelector(`#wrap-content-print-preview .canvas-content:last-child`);
                  const tableContentPreviewClone = wrapFormPrint.querySelector(`#${idTable}`).parentNode.cloneNode(true);

                  canvasLastPrint.querySelectorAll('.clone-content-print').forEach(content => { content.remove(); });
                  canvasLastPrint.querySelector('.box-content-print').appendChild(tableContentPreviewClone);

                  tableContentPreview = document.querySelector(`#wrap-content-print-preview .canvas-content:last-child .${tableName} tbody`);
                  tableContentPreview.innerHTML = '';
                }
                tableContentPreview.appendChild(tr.cloneNode(true));
              });
            }
          }
        });

        const canvasCount = document.querySelectorAll('#wrap-content-print-preview .canvas-content').length;
        const contentTbItem = document.querySelectorAll('#wrap-content-print-preview .canvas-content .box-table');

        if (canvasCount > 1) {
          contentTbItem.forEach(function (contentTb) {
            const rowCount = contentTb.querySelectorAll('tbody tr').length;
            contentTb.style.display = rowCount > 0 ? '' : 'none';
          });
        }

        resolve('ok');
      }, 2000);
    });

    openModal(`#${modalID}`);
    closeLoader();
  }

  if (act === 'print') {
    docName = 'tess';
    canvasWidth = 837 + 3;
    canvasHeight = 592 + 3;

    await generateHtmlToPdf('wrap-content-print-preview', {
      pdfWidth: canvasWidth + 27,
      pdfHeight: canvasHeight +40,
      canvasName: 'page-canvas',
      canvasType: 'L',
      fileType: 'fileTab',
      fileName: docName,
      cssOptions: {
        "*": {
          "font-family": "'PT Sans', sans-serif",
          "color": "black",
          "font-size": "8px"
        },
        ".title-text": {
          "font-size": "14px",
          "font-weight": "bold"
        },
        "h3": {
          "font-size": "14px",
          "font-weight": "bold",
          "margin-bottom": "0.5rem"
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
        ".col-footer-nilai-umum": {
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
        ".tabel-rekap-juara-lomba-print td, .tabel-rekap-juara-lomba-print th": {
          "font-size": "10px",
          "border": "1px solid black"
        },
        ".tabel-rekap-juara-lomba-print thead th": {
          "background": "#1a237e",
          "color": "white"
        },
        ".tabel-rekap-juara-lomba-print tbody .rekap-nilai-lomba, .tabel-rekap-juara-lomba-print tbody .rekap-total-rank-points,.col-predikat, .col-rank, .tabel-rekap-juara-lomba-print tbody .rekap-total-points-banding, .tabel-rekap-juara-lomba-print tbody .rekap-point-lomba, .tabel-rekap-juara-lomba-print tbody .rekap-rank-lomba": {
          "text-align": "center"
        },
        ".tabel-rekap-juara-lomba-print tbody tr:nth-child(odd)": {
          "background-color": "white"
        },
        ".tabel-rekap-juara-lomba-print tbody tr:nth-child(even)": {
          "background-color": "#dfe4ff"
        },
        ".col-no-peserta": {
          "width": "100px"
        }
      }
    });

    closeLoader();
  }
}


document.querySelectorAll('.menu-button').forEach((button) => {
  button.addEventListener('click', (e) => {
    e.stopPropagation();

    const submenu = button.nextElementSibling;
    const allSubmenus = document.querySelectorAll('.submenu');

    allSubmenus.forEach(sm => {
      if (sm !== submenu) sm.classList.add('hidden');
    });

    submenu.classList.toggle('hidden');
  });
});
