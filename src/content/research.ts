import type { FeaturedPaper, Publication } from './types';

// Citation details checked against the publisher record (Crossref, DOI 10.1109/ICCIT60459.2023.10441384).
export const featuredPaper: FeaturedPaper = {
  title: 'Leveraging Spatial and Channel Attention in VGG16 for Efficient Tomato Leaf Disease Detection',
  status: 'Peer-reviewed conference paper · Dec 2023',
  venue: '2023 26th International Conference on Computer and Information Technology (ICCIT) · IEEE',
  doi: '10.1109/ICCIT60459.2023.10441384',
  reference:
    'Al-Momin Faruk, Hasan Al Faraby, Abdul Ahad, Afsana Rimi and Md. Mahedi Hassan. Leveraging Spatial and Channel Attention in VGG16 for Efficient Tomato Leaf Disease Detection. 2023 26th International Conference on Computer and Information Technology (ICCIT), IEEE, pp. 1–6, Dec 2023. doi:10.1109/ICCIT60459.2023.10441384',
  links: [
    { label: 'Read on IEEE Xplore', href: 'https://ieeexplore.ieee.org/document/10441384' },
    { label: 'DOI record', href: 'https://doi.org/10.1109/ICCIT60459.2023.10441384' },
  ],
  summary: [
    'A VGG16 model with spatial and channel attention (VGG16 SCA) for classifying tomato leaves into 10 classes, trained with nine image augmentation techniques.',
    'The model reached 99.04% accuracy under the paper’s evaluation protocol. I am the third of five authors.',
  ],
  facts: [
    { value: '99.04%', label: 'reported accuracy' },
    { value: '10', label: 'classes' },
    { value: '9', label: 'augmentation techniques' },
  ],
  pipeline: ['Leaf image', '9 augmentations', 'VGG16 backbone', 'Spatial + channel attention', 'Classifier · 10 classes'],
};

export const publications: Publication[] = [
  {
    title: 'Detection and Mitigation Technique for Black Hole Attacks in Mobile Ad Hoc Networks (MANET)',
    status: 'Research project · not yet published',
    links: [
      {
        label: 'Project files (Google Drive)',
        href: 'https://drive.google.com/drive/folders/1sT1zhYqH9p7bpMKyWz1GR-AIi-b5LVbr?usp=sharing',
      },
    ],
    summary: [
      'Compared how MANET routing protocols hold up against black hole attacks, then proposed a way to detect and counter them.',
      'The method finds malicious nodes through targeted packet generation and broadcast, and combines this with existing defences in a hybrid approach.',
    ],
  },
  {
    title: 'All-In-One Smart Card Using Blockchain Technology',
    status: 'Undergraduate thesis · 2020',
    links: [
      {
        label: 'Thesis files (Google Drive)',
        href: 'https://drive.google.com/drive/folders/14gcn5tuDk_wT6mi0lyeo7y4MKx9ylpMc?usp=sharing',
      },
    ],
    summary: [
      'Proposed an NFC smart-card framework that uses a blockchain for identity and access, so one card could replace several.',
      'Based on a review of cryptographic protocols and distributed-ledger designs.',
    ],
  },
];
