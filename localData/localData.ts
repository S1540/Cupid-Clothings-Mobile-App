export type Subcategory = {
  title: string;
  handle: string;
  image: string | null;
};
export type Category = { name: string; handle: string; image: string };
export type BannerItem = { id: number; image: string };
export type Offer = { id: number; image: string };
export type offerCollectionsType = {
  id: number;
  gender: string;
  title: string;
  handle: string;
  bg: string;
};
// Home category Images
export const CATEGORY_IMAGES: Record<string, string> = {
  "women-plain-tshirts":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782547891/20260627_115155_0000_enekpj.png",
  "track-pants-m-to-7xl":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782548293/20260627_115155_0001_viekpp.png",
  "night-suits-sets-plus-sizes":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782548293/20260627_115155_0002_t63hza.png",
  combos:
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782548292/20260627_115155_0003_fikdxd.png",
  "women-winter-wear":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782548291/20260627_115155_0004_bq7mc2.png",
  "men-track-pants":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782726953/Bottomwear_Men_kj3q9n.png",
  "men-tracksuits":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782726953/Loungewear_Men_lpb9ja.png",
  "men-polo-tshirts":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782726953/Tshirts_Men_xw7hdn.png",
  "men-combo-sets":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782726953/combo_Men_xvzqis.png",
};

//
export const BANNERS: Record<string, BannerItem[]> = {
  Women: [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784290081/ChatGPT_Image_Jul_17_2026_05_37_22_PM_kpdqj9.png",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782218557/WhatsApp_Image_2026-06-23_at_6.06.38_PM_xzbbbn.jpg",
    },
  ],
  Men: [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782200518/10_20260623_130917_0004_ippqsj.png",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782218560/WhatsApp_Image_2026-06-23_at_6.06.36_PM_ty9fte.jpg",
    },
  ],
  "Plus-Size": [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782200515/plus_size_20260623_130917_0003_y9nwys.png",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782218557/WhatsApp_Image_2026-06-23_at_6.06.37_PM_2_ny6bfq.jpg",
    },
  ],
  "Deal's & Offers": [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782218558/WhatsApp_Image_2026-06-23_at_6.06.37_PM_1_r5athx.jpg",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782200513/Deals_and_offers_20260623_130917_0002_aupz6t.png",
    },
  ],
  "New-Arrivals": [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782218558/WhatsApp_Image_2026-06-23_at_6.06.37_PM_d4b4vf.jpg",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782200508/New_arrivals_20260623_130917_0001_vxvfxn.png",
    },
  ],
};
//
export const OFFERS: Offer[] = [
  {
    id: 1,
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782893616/2_jm4lib.png",
  },
  {
    id: 2,
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782893616/1_uwz60k.png",
  },
];
//// Offercollection Row-1
export const offerCollections: offerCollectionsType[] = [
  {
    id: 1,
    gender: "Women",
    title: "New Arrivals",
    handle: "new-arrivals",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784790552/new_arrivals_20260722_140324_0001_akdwka.png",
  },
  {
    id: 2,
    gender: "Women",
    title: "Extra 250 Off",
    handle: "lower-recommendations",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784790559/250_OFF_20260722_140325_0004_uuqhyz.png",
  },
  {
    id: 3,
    gender: "Women",
    title: "Fixed 50% Off",
    handle: "flat-50-on-2-items",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784790552/Best_seller_20260722_140324_0000_ev4ktz.png",
  },
  {
    id: 4,
    gender: "Men",
    title: "Complete The Look",
    handle: "/",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784790546/TRENDING_now_20260722_140325_0008_hb6tmw.png",
  },
  {
    id: 5,
    gender: "Men",
    title: "Complete The Look",
    handle: "/",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784790549/new_arrivals_2__20260722_140325_0007_yadvjf.png",
  },
  {
    id: 6,
    gender: "Men",
    title: "Complete The Look",
    handle: "/",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784790554/Combo_20260722_140325_0006_lawfn4.png",
  },
  {
    id: 7,
    gender: "Men",
    title: "Complete The Look",
    handle: "/",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784790548/UNDER_499_20260722_140325_0005_ebxfoh.png",
  },
];
// Offercollection Row-2
export const offerCollections2: offerCollectionsType[] = [
  {
    id: 1,
    gender: "Women",
    title: "We Loved Bestseller",
    handle: "bestseller",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784790552/BESTSELLR_20260722_140324_0003_mgai4s.png",
  },
  {
    id: 2,
    gender: "Women",
    title: "All Under ₹495",
    handle: "all-under-495",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784790553/499_20260722_140324_0002_kclhyv.png",
  },
];
// Kids Scroller Data
export const KidsCollection: offerCollectionsType[] = [
  {
    id: 1,
    gender: "Kids",
    title: "New Arrivals",
    handle: "new-arrivals",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784624170/WhatsApp_Image_2026-07-21_at_2.25.40_PM_yz4pu5.jpg",
  },
  {
    id: 2,
    gender: "Kids",
    title: "New Arrivals",
    handle: "new-arrivals",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784625055/WhatsApp_Image_2026-07-21_at_2.40.15_PM_sm0b5d.jpg",
  },
  {
    id: 3,
    gender: "Kids",
    title: "New Arrivals",
    handle: "new-arrivals",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784624170/WhatsApp_Image_2026-07-21_at_2.25.40_PM_yz4pu5.jpg",
  },
  {
    id: 4,
    gender: "Kids",
    title: "New Arrivals",
    handle: "new-arrivals",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784624711/WhatsApp_Image_2026-07-21_at_2.34.46_PM_vucwvv.jpg",
  },
];
