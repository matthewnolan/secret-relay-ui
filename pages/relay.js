import React, { useState, useEffect } from 'react';
import Blockies from "react-blockies";
import Link from 'next/link';
// import { makeStyles } from '@material-ui/core/styles';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import Container from '@material-ui/core/Container';
import Button from '@material-ui/core/Button';
import { ArrowBack, ThreeDRotation } from '@material-ui/icons';
// https://v4.mui.com/components/material-icons/
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import dynamic from "next/dynamic";

import * as secretUtil from '../src/utils/secretutil.js';

import { ethers } from "ethers";
const { SecretNetworkClient, MetaMaskWallet } = require("secretjs");

let globalVar = {
  votingTokenBal: "89",
  propId: "12",
  secretVotesYes: 10,
  secretVotesNo: 10,
}

const Index = () => {
  const classes = useStyles();

  // Secret
  const [signerAddressSecret, setsignerAddressSecret] = useState("");
  const [myBal, setMyBal] = useState("");
  const [count, setCount] = useState(0);
  const [secretVoteYes, setSecretVoteYes] = useState(0);
  const [secretVoteNo, setSecretVoteNo] = useState(0);
  const [secretVoteYesPerc, setSecretVoteYesPerc] = useState(0);
  const [secretVoteNoPerc, setSecretVoteNoPerc] = useState(0);
  const [secretjs, setSecretjs] = useState();
  const [keplrReady, setKeplrReady] = useState(false);
  const [secretEthAddy, setSecretEthAddy] = useState("");
  const [secretvotingTokenBal, setSecretvotingTokenBal] = useState("");
  const [secretWhitelistTx, setSecretWhitelistTx] = useState("");
  // Ethers
  const [ethersReady, setEthersReady] = useState(false);
  const [signerAddressEth, setSignerAddressEth] = useState("");
  const [balanceEth, setbalanceEth] = useState("");
  const [provider, setProvider] = useState(undefined);
  // Other
  const [appStatusMessage, setAppStatusMessage] = useState("Secret Ballot Dao Voting For Ethereum Users");
  const [voteReady, setVoteReady] = useState(false);
  const [aniRelay, setAniRelay] = useState(false);
  
  /////////////////////////////////////--API/UTIL--/////////////////////////////////////////////

  // const callApiTemp = async (msgOut) => {
  //   console.log("call  api");
  //   const requestMetadata = {
  //     method: 'GET',
  //     headers: {
  //       'Content-Type': 'application/json'
  //     }
  //   };
  //   fetch("http://localhost:8080/makeproposal", requestMetadata)
  //     .then(theMsg => {
  //       console.log(theMsg);
  //     }).catch(error => {
  //       console.log(error);
  //     }).finally(() => {
  //       console.log("FINALLY");
  //       setVoteReady(true);
  //     });
  // }

  const callRelayWhitelist = async (msgOut) => {
    console.log("calling api ", msgOut);
    const apiUrl = 'http://localhost:8080/addwhitelist/';
    const requestMetadata = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: msgOut
    };
    fetch(apiUrl, requestMetadata)
      .then(res => res.json())
      .then(theMsg => {
        console.log("Good API Res");
        // console.log(theMsg);
        updateSecretUi(theMsg);
        setVoteReady(true);
      }).catch(error => {
        console.log(error);
      }).finally(() => {
        console.log("FINALLY");
      });
  }

  const increment = async () => {
    console.log("incrementing");

    try {
      const tx = await secretjs.tx.compute.executeContract({
          sender: signerAddressSecret,
          contractAddress: secretUtil.contractAddress,
          msg: { increment: {} }
        },{ gasLimit: 500_000 });

      // console.log(`broadcasted tx=${JSON.stringify(tx)}`);
      // console.log(tx);
      console.log(tx.transactionHash);
      // let showTxUrl = "https://secretnodes.com/pulsar/transactions/" + tx.transactionHash;
      // TODO open this TX https://secretnodes.com/pulsar/transactions/
      const { count } = await secretjs.query.compute.queryContract({
        contractAddress: secretUtil.contractAddress,
        // codeHash: contractCodeHash,
        query: { get_count: {} }
      });
      // console.log(`counter=${count}`);
      setCount(count);
      updateSecretVotes(count);
      handleModalOpen();
    } catch (err) {
      console.error(err);
    }
  };

  const truncateAddress = (address) => {
    return address.slice(0, 8) + "..." + address.slice(-3);
  };

  const updateSecretUi = (theMsg) => {
    // console.log("updateSecretUi   ", theMsg)
    console.log(theMsg.voteResult.ethAddy);
    setSecretEthAddy(theMsg.voteResult.ethAddy);
    setSecretvotingTokenBal(theMsg.voteResult.votingTokenBal);
    setSecretWhitelistTx(theMsg.voteResult.secretWhitelistTx);
  }

  const updateSecretVotes = (singleCount) => {
    function calcPerc(partialValue, totalValue) {
      return Math.round((partialValue / totalValue) * 100);
    } 
    let tempYesCount = globalVar.secretVotesYes + singleCount;
    let votesTotal = tempYesCount + globalVar.secretVotesNo;
    setSecretVoteYes(tempYesCount);
    setSecretVoteNo(globalVar.secretVotesNo);
    setSecretVoteYesPerc(calcPerc(tempYesCount, votesTotal));
    setSecretVoteNoPerc(calcPerc(globalVar.secretVotesNo, votesTotal));
  }


  // for progress bar
  const BorderLinearProgress = withStyles((theme) => ({
    root: {
      height: 15,
      borderRadius: 5,
    },
    colorPrimary: {
      backgroundColor: theme.palette.grey[theme.palette.type === 'dark' ? 200 : 700],
    },
    bar: {
      borderRadius: 5,
      backgroundColor: '#384aff',
    },
  }))(LinearProgress);

  // Modal
  const [open, setOpen] = React.useState(false);
  const handleModalOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  // const handleAnimate = () => {
  //   let runAnonymousFunction = setTimeout(function () {
  //     setAniRelay(true);
  //   }, 1000);
  //   setAniRelay(false);
  // }
  // handleAnimate();

  // const hide = async (ms) => {
  //   setAniRelay(true)
  //   await new Promise(r => setTimeout(r, ms))
  //   setAniRelay(false)

  // }
  // hide(1000);

  /////////////////////////////////////-- ETH --//////////////////////////////////////////////////

  const connectEthers = async () => {
    // setAppStatusMessage("Connecting to MetaMask")
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const accounts = await provider.send("eth_requestAccounts", []);
    const balance = await provider.getBalance(accounts[0]);
    const balanceInEth = ethers.utils.formatEther(balance);
    setEthersReady(true);
    setbalanceEth(balanceInEth);
    setSignerAddressEth(accounts[0]);
    setProvider(provider);
    // setAppStatusMessage("MetaMask Connected")
    // signEthTx();
  }
  // connectEthers();

  const disconnectEthers = async () => {
    console.log('disconnectEthers');
    setEthersReady(false);
  }

  const signEthTx = async () => {
    // console.log('signEthTx');
    // setAppStatusMessage("Sign Message to Vote on Secret")
    let userInfo = {
      "ethAddy": signerAddressEth,
      "srtAddy": signerAddressSecret,
      "propId": globalVar.propId,
      "votingTokenBal": globalVar.votingTokenBal
    };
    const userInfoStr = JSON.stringify(userInfo);
    // console.log(userInfo);

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner();
    const signedMessage = await signer.signMessage(userInfoStr);
    userInfo.signature = signedMessage;
    const userInfoStrOut = JSON.stringify(userInfo);
    callRelayWhitelist(userInfoStrOut);
    const signerAddr = await ethers.utils.verifyMessage(userInfoStr, signedMessage)
    // console.log("signerAddr", signerAddr);
    
  }


  useEffect(() => {

  /////////////////////////////////////--SRT--//////////////////////////////////////////////////

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const getKeplr = async () => {
      // Wait for Keplr to be injected to the page
      while (
        !window.keplr &&
        !window.getOfflineSigner &&
        !window.getEnigmaUtils
      ) {
        await sleep(10);
      }

      await window.keplr.experimentalSuggestChain({
        chainId: secretUtil.CHAIN_ID,
        chainName: secretUtil.CHAIN_NAME,
        rpc: secretUtil.RPC_URL,
        rest: secretUtil.LCD_URL,
        bip44: {
          coinType: 529,
        },
        coinType: 529,
        stakeCurrency: {
          coinDenom: secretUtil.DENOM,
          coinMinimalDenom: secretUtil.MINIMAL_DENOM,
          coinDecimals: 6,
        },
        bech32Config: {
          bech32PrefixAccAddr: "secret",
          bech32PrefixAccPub: "secretpub",
          bech32PrefixValAddr: "secretvaloper",
          bech32PrefixValPub: "secretvaloperpub",
          bech32PrefixConsAddr: "secretvalcons",
          bech32PrefixConsPub: "secretvalconspub",
        },
        currencies: [
          {
            coinDenom: secretUtil.DENOM,
            coinMinimalDenom: secretUtil.MINIMAL_DENOM,
            coinDecimals: 6,
          },
        ],
        feeCurrencies: [
          {
            coinDenom: secretUtil.DENOM,
            coinMinimalDenom: secretUtil.MINIMAL_DENOM,
            coinDecimals: 6,
          },
        ],
        gasPriceStep: {
          low: 0.1,
          average: 0.25,
          high: 0.4,
        },
        features: ["secretwasm"],
      });

      // Enable Keplr.
      await window.keplr.enable(secretUtil.CHAIN_ID);

      // Setup SecrtJS with Keplr's OfflineSigner
      // This pops-up a window for the user to sign on each tx we sent
      const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(secretUtil.CHAIN_ID);

      const [{ address: signerAddressSecret }] = await keplrOfflineSigner.getAccounts();

      const secretjs = await SecretNetworkClient.create({
        grpcWebUrl: secretUtil.GRPCWEB_URL,
        chainId: secretUtil.CHAIN_ID,
        wallet: keplrOfflineSigner,
        walletAddress: signerAddressSecret,
        encryptionUtils: window.getEnigmaUtils(secretUtil.CHAIN_ID),
      });
      
      // test contract query
      const { count } = await secretjs.query.compute.queryContract({
        contractAddress: secretUtil.contractAddress,
        // contractAddress: contractCodeHash,
        // codeHash: contractCodeHash,
        query: { get_count: {} }
      });

      const { balance } = await secretjs.query.bank.balance({
        address: signerAddressSecret,
        denom: "uscrt",
      });

      updateSecretVotes(count);

      setCount(count);
      setMyBal(balance.amount);
      setKeplrReady(true);
      setsignerAddressSecret(signerAddressSecret);
      setSecretjs(secretjs);
    }
    getKeplr();

    return () => { };
  }, []);

  return (
    <main className={classes.main}>

      <Container maxwidth="lg">
        <Grid container direction="row" justifyContent="center" alignItems="center" className={classes.heroSpace}>
          <Grid item xs={12}>
            {/* <h1>{appStatusMessage}</h1> */}
            <h2>Secret Voting on Ethereum Technical Demo</h2>
          </Grid>
          {/* e grid item */}
        </Grid>
        {/* e grid cont */}






        <Grid container spacing={2} 
          direction="row"
          justifyContent="space-between"
          alignItems="stretch">
          <Grid item xs={12} sm={4} className={classes.boxStyle}>
            <div className="addPadding">
                <h1>Secret Side</h1>
                <div>
                  {/* {!keplrReady ? <h4>Sign into Keplr</h4> : <h4>Keplr Connected</h4>} */}
                  <Button variant="contained" color="primary" size="medium"
                    className={signerAddressSecret ? classes.buttonNewGreen : classes.buttonNew}
                    startIcon={
                      <Blockies
                        className={classes.img}
                        seed={signerAddressSecret.toLowerCase()}
                        size={6}
                        scale={3}
                      />
                    }
                  >
                    {signerAddressSecret ? truncateAddress(signerAddressSecret) : "Connect Keplr"}
                  </Button>
                </div>                
                <div className="metricsPanel">
                    <div><strong>Data from Ethereum</strong></div>
                    <div className="greenText"><strong>ETH addy:</strong> {truncateAddress(secretEthAddy)}</div>
                    <div className="greenText"><strong>Voting Weight:</strong> {secretvotingTokenBal}</div>
                  <p className="voteButtons">
                    <div><strong>Actions</strong></div>
                  <Button variant="outlined" color="secondary" onClick={signEthTx} className={voteReady ? "" : "btnDisabled"}>New Proposal</Button>
                  {/* <Button variant="outlined" color="secondary" onClick={signEthTx} className={voteReady ? "" : "btnDisabled"}>Get Vote Result</Button> */}
                  </p>
                  <p>
                    <div><strong>Secret Info</strong></div>
                    <div className="greenText"><strong>Secret Bal:</strong> {myBal}</div>
                    <div className="greenText"><strong>Proposal ID:</strong> {globalVar.propId}</div>
                    {/* <div className="greenText"><strong>Voter Whitelist TX:</strong> {secretWhitelistTx}</div> */}
                  </p>
                  {/* <div><strong>Proposal Start Time:</strong> </div> */}
                  {/* <div><strong>Proposal End Time:</strong> </div> */}
                  <p>
                    <div><strong>Vote Secretly</strong></div>
                    <div className="voteButtons">
                    <Button variant="outlined" className={voteReady ? "" : "btnDisabled"} style={{ borderColor: "#fff" }}
                        onClick={increment}
                      >Yes</Button>
                    <Button variant="contained" variant="outlined" className={voteReady ? "" : "btnDisabled"} style={{ borderColor: "#fff" }}
                        onClick={increment}
                      >No</Button>
                    </div>
                  </p>
                </div>

                <div className={classes.voteScore}>
                <div>Yes: {secretVoteYes}</div>
                <BorderLinearProgress variant="determinate" value={secretVoteYesPerc} />
                <br />
                <div>No: {secretVoteNo}</div>
                <BorderLinearProgress variant="determinate" value={secretVoteNoPerc} />
                </div>

              </div>
          </Grid>

          {/* <Grid item xs={12} sm={4} alignItems="center" className="animiddle" style={{ display: "flex", justifyContent: "flex-start", textAlign: "center" }}>
            <div style={{ width: "100%", textAlign: "center" }} className={aniRelay ? "aniBack" : "aniHidden"}>
              <ArrowBack fontSize="large" />
            </div> */}

          <Grid item xs={12} sm={3} alignItems="center" style={{ display: "flex", justifyContent: "flex-start"}}>
            <div className="addPadding">
              <h2>Relayer Task 1</h2>
              <div className={voteReady ? "" : "btnDisabled"}>
                <ul className="no-bullets greenText">
                  <li>Verifying ETH address</li>
                  <li>Querying ETH token val</li>
                  <li>Connecting to Secret</li>
                  <li>Submiting voter data</li>
                  <li>Voter added</li>
                </ul>
              </div>
            </div>
          </Grid>

          <Grid item xs={12} sm={4} className={classes.boxStyle}>
            <div className="addPadding">
              <h1>Ethereum Side</h1>
              <div >
                {/* {!ethersReady ? <h4>Sign into MetaMask</h4> : <h4>MetaMask Connected</h4>} */}
                <Button variant="contained" color="primary" size="medium"
                  className={ethersReady ? classes.buttonNewGreen : classes.buttonNew}
                  onClick={ethersReady ? disconnectEthers : connectEthers}
                  startIcon={
                    <Blockies
                      className={classes.img}
                      seed={signerAddressEth}
                      size={6}
                      scale={3}
                    />
                  }
                >
                  {ethersReady ? truncateAddress(signerAddressEth) : "Connect MetaMask"}
                </Button>
              </div>
              <div className="metricsPanel">
                <div><strong>Ethereum Info</strong></div>
                <div className="greenText"><strong>My Eth Bal:</strong> {balanceEth}</div>
                <div className="greenText"><strong>Voting Token Balance:</strong> {ethersReady ? globalVar.votingTokenBal : ""}</div>
                <p className="voteButtons">
                  <div><strong>Actions</strong></div>
                  <Button variant="outlined" color="secondary" onClick={signEthTx}
                    className={ethersReady ? "" : "btnDisabled"}
                  >Whitelist User</Button>
                  {/* <Button variant="outlined" color="secondary" onClick={signEthTx} className={ethersReady ? "" : "btnDisabled"}>Query Results</Button> */}
                </p>
              </div>

              <div className={classes.voteScore}>
                <div>Yes: {secretVoteYes}</div>
                <BorderLinearProgress variant="determinate" value={secretVoteYesPerc} />
                <br />
                <div>No: {secretVoteNo}</div>
                <BorderLinearProgress variant="determinate" value={secretVoteNoPerc} />
              </div>
            </div>
          </Grid>


          <Grid container spacing={1} maxWidth="lg" className={classes.boxStyle} container direction="row" justifyContent="center" alignItems="center" style={{display: 'none'}}>
            <Grid container item xs={12} spacing={3}>
              <Grid item xs={4}>
                <div className="addPadding">
                  <h2>Relayer Task 1</h2>
                  <div className={voteReady ? "" : "btnDisabled"}>
                    <ul className="no-bullets greenText">
                      <li>Verifying ETH address</li>
                      <li>Querying voting token val from ETH</li>
                      <li>Connecting to Secret</li>
                      <li>Submiting voter data</li>
                      <li>Voter added</li>
                    </ul>
                  </div>
                </div>
              </Grid>
              <Grid item xs={4}>
                {/* <div className={classes.addPadding}>
                  <h2>Relayer Task 2</h2>
                  <ul>
                    <li>Verifying signed message</li>
                    <li>Getting voting token bal from Eth</li>
                  </ul>
                </div> */}
              </Grid>
              <Grid item xs={4}>
                <div className="addPadding hidden">
                  <h2>Relayer Util</h2>
                  <div><button onClick={increment}>Increment</button></div>
                  <div><button onClick={signEthTx}>signEthTx / callRelayWhitelist</button></div>
                  <div><button onClick={callRelayWhitelist}>callRelayWhitelist</button></div>
                  {/* <button type="button" onClick={handleModalOpen}>pop modal</button> */}
                  {/* <p><strong>Counter:</strong> {count}</p> */}

                </div>
              </Grid>
            </Grid>
          </Grid>

        </Grid>
      </Container>




      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        className={classes.modal}
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          {/* <div className={classes.paper}> */}
          <div className={classes.paperModal}>
            <h1 id="transition-modal-title">YAY!<br/>You Voted Secretly!</h1>
            {/* <p id="transition-modal-description">react-transition-group animates me.</p> */}
          </div>
        </Fade>
      </Modal>

    </main>
  );
}

const useStyles = makeStyles((theme) => ({
  green: { backgroundColor: 'rgb(33 182 111)', color: '#ffffff'},
  purple: { backgroundColor: 'rgb(124 58 237)', color: '#ffffff' },
  red: { backgroundColor: 'rgb(255 56 86)', color: '#ffffff' },
  blue: { backgroundColor: '#384aff', color: '#ffffff' },

  boxStyle: {
    // backgroundColor: '#333333',
    borderColor: '#444444',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '20px',
    margin: '1em 0',
    // padding: theme.spacing(4)
  },
  addPadding: {
    padding: '1em',
  },
  listHolder: {
    // width: '100%',
    borderColor: '#444444',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '20px',
    margin: '1em 0',
    padding: theme.spacing(3),
    display: 'flex'
  },
  listContent: {
    width: '100%',
    display: 'inline-block'
  },
  listBadge: {
    width: 'auto',
    paddingRight: '1em',
    display: 'inline-block'
  },
  listTitle: {
    fontSize: '2em',
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 0,
    // verticalAlign: 'text-top',
    display: 'block'
  },
  listVoteCount: {
    fontSize: '1.5em',
    fontWeight: 'bold',
    marginTop: "1em",
    // marginBottom: "1em",
  },
  voteScore: {
    display: 'block',
    marginTop: '1em'
  },
  main: {
    width: '100%',
    margin: '20px auto',
    // maxWidth: 1100,
    // textAlign: 'center'
  },
  text: {
    // fontSize: 18
  },
  btn: {
    background: 'rgb(183,192,238)',
    cursor: 'pointer',
    border: 0,
    outline: 'none',
    borderRadius: 9999,
    height: 50,
    display: 'inline-block',
    alignItems: 'center',
    fontSize: '1.5em'
  },
  buttonNew: {
    borderColor: 'rgb(33 182 111)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: 10,
    textTransform: 'none',
    boxShadow: 'none',
    minWidth: '220px'
  },
  buttonNewGreen: {
    borderColor: 'rgb(33 182 111)',
    borderWidth: '1px',
    borderStyle: 'solid',
    // backgroundColor: 'rgba(33,182,111,0.2)',
    borderRadius: 10,
    textTransform: 'none',
    boxShadow: 'none',
    minWidth: '220px'
  },
  buttonVote: {
    borderColor: '#666666',
    borderWidth: '1px',
    borderStyle: 'solid',
    marginLeft: '1em',
    textTransform: 'none'
  },

  img: {
    borderRadius: 999,
    marginRight: 5
  },
  root: {
    width: '100%',
    // maxWidth: '36ch',
  },
  inline: {
    display: 'inline',
  },
  avatar: {
    marginRight: '15px',
  },
  item: {
    padding: theme.spacing(2),
    marginBottom: '20px',
    backgroundColor: '#333333'
  },
  // paper: {
  //   padding: theme.spacing(2),
  //   textAlign: 'center',
  //   backgroundColor: '#444444'
  // },
  heroSpace: {
    textAlign: 'center',
    marginTop: '1em',
    marginBottom: '1em'
  },
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperModal: {
    backgroundColor: 'rgb(124 58 237)',
    color: '#ffffff',
    textAlign: 'center',
    border: '2px solid #000',
    borderRadius: '20px',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

export default Index;
