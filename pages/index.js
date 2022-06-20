import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // lotteryState keeps track of whether the lottery is open or closed
  const [lotteryState, setLotteryState] = useState("0");
  // isWinner keeps track of whether the address won the lottery
  const [isWinner, setIsWinner] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // checks if the currently connected MetaMask wallet is the owner of the contract
  const [isOwner, setIsOwner] = useState(false);
  // entryCount keeps track of the number of lottery entries that have been submitted
  const [entryCount, setEntryCount] = useState(0);
  // minEntryCount keeps track of the number of lottery entries that have been submitted
  const [minEntryCount, setMinEntryCount] = useState(1);
  // hasEntered keeps track of whether address has entered into lottery
  const [hasEntered, setHasEntered] = useState(false);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  /**
   * submitEntry: Enters lottery
   */
  const submitEntry = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const lotteryContract = new Contract(
        CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the mint from the contract to mint the Crypto Dev
      const tx = await lotteryContract.submitEntry({
        // value signifies the cost of one crypto dev which is "0.01" eth.
        // We are parsing `0.01` string to ether using the utils library from ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      setHasEntered(true);
      window.alert("You successfully entered the lottery!");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * withdrawWinnings: Enters lottery
   */
  const withdrawWinnings = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const lotteryContract = new Contract(
        CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the mint from the contract to mint the Crypto Dev
      const tx = await lotteryContract.withdrawPrizeMoney({});
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully withdrawn your prize money!");
    } catch (err) {
      console.error(err);
    }
  };

  /*
      connectWallet: Connects the MetaMask wallet
    */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * assignWinner: assigns winner for the lottery
   */
  const assignWinner = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const lotteryContract = new Contract(
        CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the startPresale from the contract
      const tx = await lotteryContract.assignWinner();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You've initiated the process to select a winner!");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * checkLotteryState: check lottery state
   */
  const checkLotteryState = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const lotteryContract = new Contract(CONTRACT_ADDRESS, abi, provider);
      // call the presaleStarted from the contract
      const _lotteryState = await lotteryContract.state();
      setLotteryState(_lotteryState);
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * checkHasEntered: check whether address has entered lottery
   */
  const checkHasEntered = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const signer = await getProviderOrSigner(true);
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const lotteryContract = new Contract(CONTRACT_ADDRESS, abi, signer);
      const address = await signer.getAddress();
      const addressEntryCount = await lotteryContract.ownerEntryCount(address);
      if (addressEntryCount == 1) {
        setHasEntered(true);
      }
      else {
        setHasEntered(false);
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };


  /**
   * checkIfWinner: checks if current address is the winner
   */
  const checkIfWinner = async () => {
    try {
      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      // We connect to the Contract using a signert
      const lotteryContract = new Contract(CONTRACT_ADDRESS, abi, signer);
      // get user address
      const address = await signer.getAddress();
      // get winner address from contract
      const prizeAmount = await lotteryContract.ownerPrizeAmount(address);
      if (prizeAmount > 0) {
        setIsWinner(true);
      }
      else {
        setIsWinner(false);
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * getOwner: calls the contract to retrieve the owner
   */
  const getOwner = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const lotteryContract = new Contract(CONTRACT_ADDRESS, abi, provider);
      // call the owner function from the contract
      const _owner = await lotteryContract.owner();
      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      if (address.toLowerCase() == _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  /**
   * getEntryCount: gets the number of lottery entries
   */
  const getEntryCount = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const lotteryContract = new Contract(CONTRACT_ADDRESS, abi, provider);
      // call the tokenIds from the contract
      const _entryCount = await lotteryContract.entryCount();
      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setEntryCount(_entryCount.toNumber());
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * getMinEntryCount: gets the number of lottery entries
   */
  const getMinEntryCount = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const lotteryContract = new Contract(CONTRACT_ADDRESS, abi, provider);
      const _minEntryCount = await lotteryContract.minEntryCount();
      setMinEntryCount(_minEntryCount.toNumber());
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getMinEntryCount();
      getOwner();
      checkHasEntered();

      // // set an interval to check if address has entered every 5 seconds
      // setInterval(async function () {
      //   await checkHasEntered();
      // }, 5 * 1000);

      // Set an interval which gets called every 5 seconds to check if there's a winner
      setInterval(async function () {
        await checkIfWinner()
      }, 5 * 1000);

      // set an interval to get the number of token Ids minted every 5 seconds
      setInterval(async function () {
        await getEntryCount();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  /*
      renderButton: Returns a button based on the state of the dapp
    */
  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wllet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // If connected user is the owner, and entry count has exceeded minimum threshold, allow user to assign winner
    if (isOwner && entryCount >= minEntryCount) {
      return (
        <button className={styles.button} onClick={assignWinner}>
          Assign winner!
        </button>
      );
    }

    // If lottery is paused, tell them that
    if (lotteryState == "1") {
      return (
        <div>
          <div className={styles.description}>Lottery paused, come back later!</div>
        </div>
      );
    }

    // If address is winner
    if (isWinner) {
      return (
        <div>
          <div className={styles.description}>
            Congrats you are a winner! 🥳
          </div>
          <button className={styles.button} onClick={withdrawWinnings}>
            Withdraw prize money 🤑
          </button>
        </div>
      );
    }

    // If user has entered, thank them
    if (hasEntered) {
      return (
        <div>
          <div className={styles.description}>Thank you for participating! 🤟</div>
        </div>
      );
    }

    // If presale started and has ended, its time for public minting
    if (lotteryState == "0") {
      return (
        <button className={styles.button} onClick={submitEntry}>
          🍀 Try your luck! 🍀
        </button >
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Smart Contract Lottery</title>
        <meta name="description" content="Smart-Contract-Lottery" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <img className={styles.image} src="./smart-contract-lottery.png" />
          <h1 className={styles.title}>Welcome and enter away!</h1>
          <div className={styles.description}>
            Feeling lucky? Come try out our lottery on Ethereum. Winners are randomly selected using chainlink!
          </div>
          <div className={styles.description}>
            We have received {entryCount} entries
          </div>
          {renderButton()}
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by SL
      </footer>
    </div>
  );
}
