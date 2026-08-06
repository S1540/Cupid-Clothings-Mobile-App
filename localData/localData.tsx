import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type Subcategory = {
  title: string;
  handle: string;
  image: string | null;
};
export type Category = { name: string; handle: string; image: string };
export type BannerItem = { id: number; image: string; handle?: string };
export type Offer = { id: number; image: string };
export type offerCollectionsType = {
  id: number;
  gender: string;
  title: string;
  handle: string;
  bg: string;
};
export type ComfortableItem = {
  id: string;
  gender: string;
  title: string;
  subtitle: string;
  handle: string;
  image: string;
  icon?: React.ReactNode;
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

//mn
export const BANNERS: Record<string, BannerItem[]> = {
  Women: [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785568202/WhatsApp_Image_2026-08-01_at_12.37.18_PM_a0bvig.jpg",
      handle: "women-plain-tshirts",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785568202/WhatsApp_Image_2026-08-01_at_12.37.18_PM_2_h4hfm5.jpg",
      handle: "girls-top-pajama-set",
    },
    {
      id: 3,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785496330/20_qu1dfq.png",
      handle: "new-arrivals",
    },
    {
      id: 4,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785568202/WhatsApp_Image_2026-08-01_at_12.37.18_PM_1_nfs93b.jpg",
      handle: "girls-top-pajama-set",
    },
  ],
  Men: [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785503017/Curves_Deserve_2_rkcszr.png",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785568202/WhatsApp_Image_2026-08-01_at_12.37.17_PM_q3haza.jpg",
    },
  ],
  "Plus-Size": [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785496327/21_ynrlfd.png",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782218557/WhatsApp_Image_2026-06-23_at_6.06.37_PM_2_ny6bfq.jpg",
    },
  ],
  "Best Sellers": [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785411884/best_sellers_abapba.png",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785576868/WhatsApp_Image_2026-08-01_at_12.58.34_PM_u1zv8l.jpg",
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
// Comfortable Section Data gender wise
export const COMFORTABLE: ComfortableItem[] = [
  {
    id: "1",
    gender: "Women",
    title: "Gymwear",
    subtitle: "Move. Sweat. Repeat.",
    handle: "gymwear",
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784811627/gym_xapg0h.png",
    icon: <MaterialCommunityIcons name="dumbbell" size={16} color="#F0417D" />,
  },
  {
    id: "2",
    gender: "Women",
    title: "Travel",
    subtitle: "Comfort that goes where you go.",
    handle: "travel-wear",
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784811627/travel_k0la06.png",
    icon: (
      <MaterialCommunityIcons name="bag-suitcase" size={16} color="#7C3FD6" />
    ),
  },
  {
    id: "3",
    gender: "Women",
    title: "Sleepwear",
    subtitle: "Soft fits for your best sleep.",
    handle: "night-suits-sets-plus-sizes",
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784811627/nightwear_lhzbpb.png",
    icon: (
      <MaterialCommunityIcons name="weather-night" size={16} color="#F0417D" />
    ),
  },
  {
    id: "4",
    gender: "Women",
    title: "Everyday Wear",
    subtitle: "Easy, comfy & made for you.",
    handle: "everyday-wear",
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1784811628/casual_onyjkj.png",
    icon: (
      <MaterialCommunityIcons name="tshirt-crew" size={16} color="#E08A1F" />
    ),
  },
  {
    id: "5",
    gender: "Men",
    title: "Gymwear",
    subtitle: "Move. Sweat. Repeat.",
    handle: "men-gymwear",
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785408343/gym_wear_s6plju.png",
    icon: <MaterialCommunityIcons name="dumbbell" size={16} color="#F0417D" />,
  },
  {
    id: "7",
    gender: "Men",
    title: "Travel",
    subtitle: "Comfort that goes where you go.",
    handle: "men-travelwear",
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785408343/travel_fvpclq.png",
    icon: (
      <MaterialCommunityIcons name="bag-suitcase" size={16} color="#7C3FD6" />
    ),
  },
  {
    id: "8",
    gender: "Men",
    title: "Streetwear",
    subtitle: "Soft fits for your best sleep.",
    handle: "Men-streetwear",
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785408343/streetwear_rht1ba.png",
    icon: (
      <MaterialCommunityIcons name="weather-night" size={16} color="#F0417D" />
    ),
  },
  {
    id: "9",
    gender: "Men",
    title: "Everyday Wear",
    subtitle: "Easy, comfy & made for you.",
    handle: "men-casualwear",
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785408343/everyday_wear_bizs6h.png",
    icon: (
      <MaterialCommunityIcons name="tshirt-crew" size={16} color="#E08A1F" />
    ),
  },
];

//// Offercollection Row-1
export const offerCollections: offerCollectionsType[] = [
  {
    id: 1,
    gender: "Women",
    title: "New Arrivals",
    handle: "new-arrivals",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241975/new_arrivals_20260728_175738_0000_b9dnhf.png",
  },
  {
    id: 2,
    gender: "Women",
    title: "Extra 250 Off",
    handle: "lower-recommendations",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241970/250_OFF_20260728_175738_0003_tjldfd.png",
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
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241965/TRENDING_now_20260728_175739_0007_cgqd2d.png",
  },
  {
    id: 5,
    gender: "Men",
    title: "Complete The Look",
    handle: "/",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241967/new_arrivals_2__20260728_175739_0006_mzkgud.png",
  },
  {
    id: 6,
    gender: "Men",
    title: "Complete The Look",
    handle: "/",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241972/Combo_20260728_175738_0005_io1mcd.png",
  },
  {
    id: 7,
    gender: "Men",
    title: "Complete The Look",
    handle: "/",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241967/UNDER_499_20260728_175738_0004_ltebqy.png",
  },
];
// Offercollection Row-2
export const offerCollections2: offerCollectionsType[] = [
  {
    id: 1,
    gender: "Women",
    title: "We Loved Bestseller",
    handle: "bestseller",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241970/BESTSELLR_20260728_175738_0002_qqhkaw.png",
  },
  {
    id: 2,
    gender: "Women",
    title: "All Under ₹495",
    handle: "all-under-495",
    bg: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241970/499_20260728_175738_0001_cqxyrv.png",
  },
];

// kids Images
export const kidsImages: Record<string, string> = {
  "girls-cotton-t-shirt-pajama-set-soft-co-ord-outfit-for-kids-6-9-years-6-9-years-4":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241442/ChatGPT_Image_Jul_25_2026_12_45_02_PM_yizcrh.png",

  "girls-cotton-t-shirt-pajama-set-soft-co-ord-outfit-for-kids-6-9-years-6-9-years-3":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241442/ChatGPT_Image_Jul_25_2026_12_53_00_PM_fihk64.png",

  "girls-cotton-t-shirt-pajama-set-soft-co-ord-outfit-for-kids-6-9-years-6-9-years-2":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241442/ChatGPT_Image_Jul_25_2026_12_41_14_PM_ncstyy.png",

  "girls-cotton-t-shirt-pajama-set-soft-co-ord-outfit-for-kids-6-9-years-6-9-years-1":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241442/ChatGPT_Image_Jul_25_2026_12_36_36_PM_bywmff.png",

  "girls-cotton-t-shirt-pajama-set-soft-co-ord-outfit-for-kids-6-9-years-6-9-years":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785398977/ChatGPT_Image_Jul_25_2026_12_16_08_PM_1_nlqmeu.png",

  "cupid-girls-cotton-co-ord-set-6-9-years":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1785241442/ChatGPT_Image_Jul_25_2026_12_25_03_PM_qik9la.png",
};
