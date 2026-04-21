'use client'
import Link from 'next/link'
import { useLang } from '@/lib/i18n'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <p className="footer-brand-name">Japan Property</p>
            <p className="footer-brand-jp">日本不動産</p>
            <p className="footer-tagline">{t.footer_tagline}</p>
          </div>
          <div className="footer-col">
            <h4>Properties</h4>
            <ul>
              <li><Link href="/properties?type=sale">For Sale / 売買</Link></li>
              <li><Link href="/properties?type=rent">For Rent / 賃貸</Link></li>
              <li><Link href="/properties?area=Tokyo">Tokyo / 東京</Link></li>
              <li><Link href="/properties?area=Kyoto">Kyoto / 京都</Link></li>
              <li><Link href="/properties?area=Osaka">Osaka / 大阪</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About / 会社概要</Link></li>
              <li><Link href="/contact">Contact / お問い合わせ</Link></li>
              <li><Link href="#">Privacy / プライバシー</Link></li>
              <li><Link href="#">Terms / 利用規約</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><Link href="#">Guide / ガイド</Link></li>
              <li><Link href="#">FAQ</Link></li>
              <li><Link href="#">Blog</Link></li>
              <li><Link href="/contact">Help / ヘルプ</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Japan Property University Project. All rights reserved.</span>
          <span style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.2em' }}>日本不動産株式会社</span>
        </div>
      </div>
    </footer>
  )
}
