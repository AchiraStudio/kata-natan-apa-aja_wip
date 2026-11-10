const DISTRICT_GROUPS: Array<[string, string[]]> = [
  [
    'Jakarta Pusat',
    ['Cempaka Putih', 'Gambir', 'Johar Baru', 'Kemayoran', 'Menteng', 'Sawah Besar', 'Senen', 'Tanah Abang'],
  ],
  [
    'Jakarta Utara',
    ['Cilincing', 'Kelapa Gading', 'Koja', 'Pademangan', 'Penjaringan', 'Tanjung Priok'],
  ],
  [
    'Jakarta Barat',
    ['Cengkareng', 'Grogol Petamburan', 'Kalideres', 'Kebon Jeruk', 'Kembangan', 'Palmerah', 'Taman Sari', 'Tambora'],
  ],
  [
    'Jakarta Selatan',
    ['Cilandak', 'Jagakarsa', 'Kebayoran Baru', 'Kebayoran Lama', 'Mampang Prapatan', 'Pancoran', 'Pasar Minggu', 'Pesanggrahan', 'Setiabudi', 'Tebet'],
  ],
  [
    'Jakarta Timur',
    ['Cakung', 'Cipayung', 'Ciracas', 'Duren Sawit', 'Jatinegara', 'Kramat Jati', 'Makasar', 'Matraman', 'Pasar Rebo', 'Pulo Gadung'],
  ],
  ['Kepulauan Seribu', ['Kepulauan Seribu Selatan', 'Kepulauan Seribu Utara']],
  ['Kota Bogor', ['Bogor Tengah', 'Bogor Timur', 'Bogor Barat', 'Bogor Selatan', 'Bogor Utara', 'Tanah Sareal']],
  [
    'Kabupaten Bogor',
    [
      'Babakan Madang', 'Bojonggede', 'Caringin', 'Cariu', 'Ciampea', 'Ciawi', 'Cibinong', 'Cibungbulang',
      'Cigombong', 'Cigudeg', 'Cijeruk', 'Cileungsi', 'Ciomas', 'Cisarua', 'Ciseeng', 'Citeureup', 'Dramaga',
      'Gunung Putri', 'Gunung Sindur', 'Jasinga', 'Jonggol', 'Kemang', 'Klapanunggal', 'Leuwiliang',
      'Leuwisadeng', 'Megamendung', 'Nanggung', 'Pamijahan', 'Parung', 'Parung Panjang', 'Ranca Bungur',
      'Rumpin', 'Sukajaya', 'Sukamakmur', 'Sukaraja', 'Tajurhalang', 'Tamansari', 'Tanjungsari', 'Tenjo',
      'Tenjolaya',
    ],
  ],
  [
    'Kota Depok',
    ['Beji', 'Bojongsari', 'Cilodong', 'Cimanggis', 'Cinere', 'Cipayung', 'Limo', 'Pancoran Mas', 'Sawangan', 'Sukmajaya', 'Tapos'],
  ],
  [
    'Kota Tangerang',
    ['Batuceper', 'Benda', 'Cibodas', 'Ciledug', 'Cipondoh', 'Jatiuwung', 'Karang Tengah', 'Karawaci', 'Larangan', 'Neglasari', 'Periuk', 'Pinang', 'Tangerang'],
  ],
  [
    'Kabupaten Tangerang',
    [
      'Balaraja', 'Cikupa', 'Cisauk', 'Cisoka', 'Curug', 'Gunung Kaler', 'Jambe', 'Jayanti', 'Kelapa Dua',
      'Kemiri', 'Kosambi', 'Kresek', 'Kronjo', 'Legok', 'Mauk', 'Mekar Baru', 'Pagedangan', 'Pakuhaji',
      'Panongan', 'Pasar Kemis', 'Rajeg', 'Sepatan', 'Sepatan Timur', 'Sindang Jaya', 'Solear', 'Sukadiri',
      'Sukamulya', 'Teluknaga', 'Tigaraksa',
    ],
  ],
  [
    'Kota Tangerang Selatan',
    ['Ciputat', 'Ciputat Timur', 'Pamulang', 'Pondok Aren', 'Serpong', 'Serpong Utara', 'Setu'],
  ],
  [
    'Kota Bekasi',
    ['Bantargebang', 'Bekasi Barat', 'Bekasi Selatan', 'Bekasi Timur', 'Bekasi Utara', 'Jatiasih', 'Jatisampurna', 'Medansatria', 'Mustikajaya', 'Pondokgede', 'Pondokmelati', 'Rawalumbu'],
  ],
  [
    'Kabupaten Bekasi',
    [
      'Babelan', 'Bojongmangu', 'Cabangbungin', 'Cibarusah', 'Cibitung', 'Cikarang Barat', 'Cikarang Pusat',
      'Cikarang Selatan', 'Cikarang Timur', 'Cikarang Utara', 'Karangbahagia', 'Kedungwaringin',
      'Muara Gembong', 'Pebayuran', 'Serang Baru', 'Setu', 'Sukakarya', 'Sukatani', 'Sukawangi',
      'Tambelang', 'Tambun Selatan', 'Tambun Utara', 'Tarumajaya',
    ],
  ],
];

export const METRO_JABODETABEK_DISTRICTS = DISTRICT_GROUPS.flatMap(([area, districts]) =>
  districts.map((district) => (area === 'Kota Bogor' ? district : `${area} - ${district}`))
);
