import type { FeaturedPaper, Publication } from './types';

export const featuredPaper: FeaturedPaper = {
  title: 'Leveraging Spatial and Channel Attention in VGG16 for Efficient Tomato Leaf Disease Detection',
  status: 'Published · 2023',
  venue: '26th International Conference on Computer and Information Technology (ICCIT) · IEEE',
  doi: '10.1109/ICCIT60459.2023.10441384',
  reference:
    'Leveraging Spatial and Channel Attention in VGG16 for Efficient Tomato Leaf Disease Detection. 2023 26th International Conference on Computer and Information Technology (ICCIT), IEEE. doi:10.1109/ICCIT60459.2023.10441384',
  links: [
    { label: 'IEEE Xplore', href: 'https://ieeexplore.ieee.org/document/10441384' },
    { label: 'DOI', href: 'https://doi.org/10.1109/ICCIT60459.2023.10441384' },
  ],
  summary: [
    'An attention-augmented VGG16 (VGG16 SCA) that combines spatial and channel attention to classify tomato leaf disease.',
    'Nine image augmentation techniques were used to widen the training data.',
  ],
  facts: [
    { value: '99.04%', label: 'classification accuracy' },
    { value: '10', label: 'disease classes' },
    { value: '9', label: 'augmentation techniques' },
  ],
  pipeline: ['Leaf image', '9 augmentations', 'VGG16 backbone', 'Spatial + channel attention', 'Classifier · 10 classes'],
};

export const publications: Publication[] = [
  {
    title: 'Detection and Mitigation Technique for Black Hole Attacks in Mobile Ad Hoc Networks (MANET)',
    status: 'Publication underway',
    links: [
      { label: 'Project files', href: 'https://drive.google.com/drive/folders/1sT1zhYqH9p7bpMKyWz1GR-AIi-b5LVbr?usp=sharing' },
    ],
    summary: [
      'Assessed MANET security issues across protocols and proposed a method to detect and counter black hole attacks.',
      'Malicious nodes are identified and neutralised through strategic packet generation and broadcast, combined with existing strategies in a hybrid approach.',
    ],
  },
  {
    title: 'All-In-One Smart Card Using Blockchain Technology',
    status: 'Undergraduate thesis · 2020',
    links: [
      { label: 'Thesis files', href: 'https://drive.google.com/drive/folders/14gcn5tuDk_wT6mi0lyeo7y4MKx9ylpMc?usp=sharing' },
    ],
    summary: [
      'A blockchain framework built on NFC smart cards, aiming to replace many physical cards with one.',
      'Reviewed cryptographic protocols and distributed-ledger designs, then integrated them to simplify access privileges.',
    ],
  },
];
