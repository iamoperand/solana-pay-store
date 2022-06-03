import { useState, useEffect } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

import Product from 'components/product'

// Constants
const TWITTER_HANDLE = 'iamoperand'
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`

const App = () => {
  // This will fetch the users' public key (wallet address) from any wallet we support
  const { publicKey } = useWallet()
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (publicKey) {
      fetch(`/api/fetch-products`)
        .then((response) => response.json())
        .then((data) => {
          setProducts(data)
          console.log('Products', data)
        })
    }
  }, [publicKey])

  const renderNotConnectedContainer = () => (
    <div className="button-container">
      <WalletMultiButton className="cta-button connect-wallet-button" />
    </div>
  )

  const renderItemBuyContainer = () => (
    <div className="products-container">
      {products.map((product) => (
        <Product key={product.id} product={product} />
      ))}
    </div>
  )

  return (
    <div className="App">
      <div className="container">
        <header className="header-container">
          <p className="header"> 😳 Emoji Store 😈</p>
          <p className="sub-text">The only emoji store that accepts shitcoins</p>
        </header>

        <main>{publicKey ? renderItemBuyContainer() : renderNotConnectedContainer()}</main>

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src="twitter-logo.svg" />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  )
}

export default App
