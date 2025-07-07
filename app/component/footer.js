import styles from './footer.module.css';

const Footer = ({ isDarkMode }) => (
  <footer className={`${styles.footer} ${isDarkMode ? styles.footerDark : styles.footerLight}`}>
    <div className={styles.footerContainer}>
      <div className={styles.footerContent}>
        <div className={styles.footerMain}>
          <div className={`${styles.logoFont} ${styles.footerLogo}`}>
            돚하이 자동 수집기
          </div>
          <p className={`${styles.koreanFont} ${styles.footerDescription} ${isDarkMode ? styles.footerDescriptionDark : styles.footerDescriptionLight}`}>
            돚하이 자동 수집기는 돚하이의 모든 링크를 자동으로 수집하여 제공합니다.
          </p>
        </div>
        
        <div className={styles.footerLinks}>
          <div className={styles.footerLinkGroup}>
            <h3 className={`${styles.koreanFont} ${styles.footerLinkTitle}`}>링크</h3>
            <ul className={`${styles.koreanFont} ${styles.footerLinkList} ${isDarkMode ? styles.footerLinkListDark : styles.footerLinkListLight}`}>
              <li><a href="https://www.youtube.com/@JU_RURU" className={styles.footerLink} target="_blank" rel="noopener noreferrer">주르르 유튜브</a></li>
              <li><a href="https://www.youtube.com/@UnsealedJURURU" className={styles.footerLink} target="_blank" rel="noopener noreferrer">봉인 풀린 주르르</a></li>
            </ul>
          </div>
          
          <div className={styles.footerLinkGroup}>
            <h3 className={`${styles.koreanFont} ${styles.footerLinkTitle}`}>　</h3>
            <ul className={`${styles.koreanFont} ${styles.footerLinkList} ${isDarkMode ? styles.footerLinkListDark : styles.footerLinkListLight}`}>
              <li><a href="https://ch.sooplive.co.kr/cotton1217" className={styles.footerLink} target="_blank" rel="noopener noreferrer">주르르 생방송</a></li>
              <li><a href="https://cafe.naver.com/steamindiegame" className={styles.footerLink} target="_blank" rel="noopener noreferrer">왁물원</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className={`${styles.koreanFont} ${styles.footerCopyright} ${isDarkMode ? styles.footerCopyrightDark : styles.footerCopyrightLight}`}>
        <p>&copy; 2025 dotHi. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;