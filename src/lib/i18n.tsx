'use client'
import React, { createContext, useContext, useState } from 'react'

export type Lang = 'en' | 'ja'

const translations = {
  en: {
    // Nav
    nav_home: 'Home',
    nav_properties: 'Properties',
    nav_about: 'About',
    nav_contact: 'Contact',
    nav_login: 'Login',
    nav_profile: 'My Profile',
    nav_logout: 'Logout',
    // Hero
    hero_title: 'Find Your Dream Property in Japan',
    hero_subtitle: 'Discover exceptional residences across Tokyo, Kyoto, Osaka and beyond',
    hero_search_placeholder: 'Search by city, ward, or property name...',
    hero_btn: 'Search Properties',
    // Sections
    featured: 'Featured Properties',
    featured_sub: 'Handpicked premium listings',
    all_props: 'All Properties',
    // Property
    price: 'Price',
    size: 'Size',
    rooms: 'Rooms',
    floor: 'Floor',
    station: 'Nearest Station',
    year_built: 'Year Built',
    contact_agent: 'Contact Agent',
    details: 'View Details',
    for_sale: 'For Sale',
    for_rent: 'For Rent',
    // Filters
    filter_type: 'Type',
    filter_min: 'Min Price',
    filter_max: 'Max Price',
    filter_area: 'Area',
    filter_all: 'All',
    filter_sale: 'Sale',
    filter_rent: 'Rent',
    apply: 'Apply',
    reset: 'Reset',
    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'Full Name',
    // Profile
    profile_title: 'My Profile',
    saved: 'Saved Properties',
    listings: 'My Listings',
    edit_profile: 'Edit Profile',
    // Misc
    beds: 'Bed',
    baths: 'Bath',
    sqm: 'm²',
    loading: 'Loading...',
    no_results: 'No properties found.',
    read_more: 'Read More',
    back: 'Back',
    submit: 'Submit',
    cancel: 'Cancel',
    add_listing: 'Add Listing',
    footer_tagline: 'Your trusted partner for Japan real estate',
  },
  ja: {
    nav_home: 'ホーム',
    nav_properties: '物件一覧',
    nav_about: '会社概要',
    nav_contact: 'お問い合わせ',
    nav_login: 'ログイン',
    nav_profile: 'マイページ',
    nav_logout: 'ログアウト',
    hero_title: '夢の日本不動産を見つけよう',
    hero_subtitle: '東京・京都・大阪など全国の優良物件をご紹介します',
    hero_search_placeholder: '市区町村・物件名で検索...',
    hero_btn: '物件を探す',
    featured: '注目物件',
    featured_sub: '厳選されたプレミアム物件',
    all_props: '全物件',
    price: '価格',
    size: '面積',
    rooms: '間取り',
    floor: '階数',
    station: '最寄り駅',
    year_built: '築年数',
    contact_agent: '担当者に連絡',
    details: '詳細を見る',
    for_sale: '売買',
    for_rent: '賃貸',
    filter_type: '種別',
    filter_min: '最低価格',
    filter_max: '最高価格',
    filter_area: 'エリア',
    filter_all: 'すべて',
    filter_sale: '売買',
    filter_rent: '賃貸',
    apply: '適用',
    reset: 'リセット',
    login: 'ログイン',
    register: '新規登録',
    email: 'メールアドレス',
    password: 'パスワード',
    name: 'お名前',
    profile_title: 'マイページ',
    saved: 'お気に入り物件',
    listings: '掲載物件',
    edit_profile: 'プロフィール編集',
    beds: '寝室',
    baths: 'バス',
    sqm: '㎡',
    loading: '読み込み中...',
    no_results: '物件が見つかりませんでした。',
    read_more: '続きを読む',
    back: '戻る',
    submit: '送信',
    cancel: 'キャンセル',
    add_listing: '物件を掲載',
    footer_tagline: '日本の不動産をお探しならお任せください',
  }
}

type Translations = typeof translations.en

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
