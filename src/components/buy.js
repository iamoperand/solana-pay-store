import React, { useState, useMemo, useEffect } from 'react'
import { Keypair, Transaction } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { InfinitySpin } from 'react-loader-spinner'
import { findReference, FindReferenceError } from '@solana/pay'

import IPFSDownload from './ipfs-download'
import { addOrder } from 'lib/api'

const STATUS = {
  INITIAL: 'INITIAL',
  SUBMITTED: 'SUBMITTED',
  PAID: 'PAID',
}

export default function Buy({ itemID }) {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const orderID = useMemo(() => Keypair.generate().publicKey, []) // Public key used to identify the order

  const [loading, setLoading] = useState(false) // Loading state of all above
  const [status, setStatus] = useState(STATUS.INITIAL)

  // useMemo is a React hook that only computes the value if the dependencies change
  const order = useMemo(
    () => ({
      buyer: publicKey.toString(),
      orderID: orderID.toString(),
      itemID: itemID,
    }),
    [publicKey, orderID, itemID],
  )

  // Fetch the transaction object from the server
  const processTransaction = async () => {
    setLoading(true)
    const txResponse = await fetch('/api/create-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    })
    const txData = await txResponse.json()

    // We create a transaction object
    const tx = Transaction.from(Buffer.from(txData.transaction, 'base64'))
    console.log('Tx data is', tx)

    // Attempt to send the transaction to the network
    try {
      // Send the transaction to the network
      const txHash = await sendTransaction(tx, connection)
      console.log(`Transaction sent: https://solscan.io/tx/${txHash}?cluster=devnet`)
      setStatus(STATUS.SUBMITTED)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === STATUS.SUBMITTED) {
      setLoading(true)

      const interval = setInterval(async () => {
        console.log('ping')
        try {
          const result = await findReference(connection, orderID)
          console.log('Finding tx reference', result.confirmationStatus)
          if (result.confirmationStatus === 'confirmed' || result.confirmationStatus === 'finalized') {
            clearInterval(interval)
            setStatus(STATUS.PAID)
            setLoading(false)
            addOrder(order)
            alert('Thankyou for the purchase')
          }
        } catch (e) {
          if (e instanceof FindReferenceError) {
            return null
          }
          console.error('Unknown error', e)
        } finally {
          setLoading(false)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [status])

  if (!publicKey) {
    return (
      <div>
        <p>You need to connect your wallet to make transactions</p>
      </div>
    )
  }

  if (loading) {
    return <InfinitySpin color="gray" />
  }

  return (
    <div>
      {status === STATUS.PAID ? (
        <IPFSDownload
          filename="og-emoji.png"
          hash="QmcrVpuCDjgfDmGjUTpw9tMTu7hyMWAv7kAm9kiLkYMya8"
          cta="Download emoji"
        />
      ) : (
        <button disabled={loading} className="buy-button" onClick={processTransaction}>
          Buy now
        </button>
      )}
    </div>
  )
}
