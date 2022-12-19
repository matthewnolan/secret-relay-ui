import React, { useState, useEffect } from 'react';
import Blockies from "react-blockies";
import Link from 'next/link';

// import Typography from '@material-ui/core/Typography';
import * as Mui from '@material-ui/core';

// import { makeStyles } from '@material-ui/core/styles';
// import React from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Chip from '@material-ui/core/Chip';
import LinearProgress from '@material-ui/core/LinearProgress';
import Container from '@material-ui/core/Container';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';

import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import dynamic from "next/dynamic";

import * as secretUtil from '../src/utils/secretutil.js';


// const ConnectWallet = dynamic(() => import("../src/components/ConnectWallet"), {
//   ssr: false,
// });

import { ethers } from "ethers";
const { SecretNetworkClient, MetaMaskWallet } = require("secretjs");


const Index = () => {

  const classes = useStyles();

  // Secret
  const [signerAddressSecret, setsignerAddressSecret] = useState("");
  const [myBal, setMyBal] = useState("");
  const [count, setCount] = useState(0);
  const [secretjs, setSecretjs] = useState();
  const [keplrReady, setKeplrReady] = useState(false);
  const [ethersReady, setEthersReady] = useState(false);
  // Ethers
  const [signerAddressEth, setSignerAddressEth] = useState("");
  const [provider, setProvider] = useState(undefined);
  // Other
  const [appStatusMessage, setAppStatusMessage] = useState("Secret Ballot Dao Voting on Ethereum");
  const [voteReady, setVoteReady] = useState(false);
  
  /////////////////////////////////////--API/UTIL--/////////////////////////////////////////////

  const callApiTemp = async (msgOut) => {
    console.log("call  api");
    
    const requestMetadata = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    fetch("http://localhost:8080/makeproposal", requestMetadata)
      .then(theMsg => {
        console.log(theMsg);
      }).catch(error => {
        console.log(error);
      }).finally(() => {
        console.log("FINALLY");
        setVoteReady(true);
      });
  }

  const callApiPost = async (msgOut) => {
    console.log("calling api ", msgOut);
    const apiUrl = 'http://localhost:8080/userinfo/';
    const requestMetadata = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: msgOut
    };
    apiStatusMessages();
    fetch(apiUrl, requestMetadata)
      .then(res => res.json())
      .then(theMsg => {
        console.log(theMsg);
      }).catch(error => {
        console.log(error);
      }).finally(() => {
        console.log("FINALLY");
        setVoteReady(true);
      });
  }

  const increment = async () => {
    console.log("incrementing");

    try {
      const tx = await secretjs.tx.compute.executeContract({
        sender: signerAddressSecret,
        contractAddress: secretUtil.contractAddress,
        msg: { increment: {} }
      }, { gasLimit: 500_000 });

      // console.log(`broadcasted tx=${JSON.stringify(tx)}`);
      // console.log(tx);
      console.log(tx.transactionHash);
      handleModalOpen();
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
    return address.slice(0, 9) + "..." + address.slice(-4);
  };

  const apiStatusMessages = () => {
    let count = 0;
    const i = setInterval(function () {
      const messages = [
        "Fetching voting token balance",
        "You have 100 ERC20 voting tokens on Ethereum",
        "Relaying messages to Secret Network",
        "You can now vote privately with your Ethereum tokens"
      ];
      setAppStatusMessage(messages[count]);
      count++;
      if (count >= messages.length) { clearInterval(i); }
    }, 2000);
  };

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

  /////////////////////////////////////--ETH--//////////////////////////////////////////////////

  const connectEthers = async () => {
    // console.log("get ethers");
    setAppStatusMessage("Connecting to MetaMask")
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const accounts = await provider.send("eth_requestAccounts", []);
    // const balance = await provider.getBalance(accounts[0]);
    // const balanceInEth = ethers.utils.formatEther(balance);
    // console.log(balanceInEth);
    setEthersReady(true);

    console.log(accounts[0]);
    setSignerAddressEth(accounts[0]);
    setProvider(provider);
    setAppStatusMessage("MetaMask Connected")
    signEthTx();
  }
  // connectEthers();

  const disconnectEthers = async () => {
    //TODO finish or remove
    console.log('disconnectEthers');
    // setProvider(undefined);
    // setSignerAddressEth(undefined);
    setEthersReady(false);
  }

  const signEthTx = async () => {
    console.log('signEthTx');
    setAppStatusMessage("Sign Message to Vote on Secret")
    let userInfo = {
      "ethAddy": signerAddressEth,
      "srtAddy": signerAddressSecret,
      "propId": "123",
    };
    const userInfoStr = JSON.stringify(userInfo);

    console.log(userInfo);

    // TODO CLEAN!
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner();
    const signedMessage = await signer.signMessage(userInfoStr);
    console.log(signedMessage); 
    userInfo.signature = signedMessage;
    console.log(userInfo);
    const userInfoStrOut = JSON.stringify(userInfo);
    callApiPost(userInfoStrOut);
    
    const signerAddr = await ethers.utils.verifyMessage(userInfoStr, signedMessage)
    console.log("signerAddr", signerAddr);
    
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
      // console.log(secretjs);
      
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

          <Grid item xs={6} md={6}>
            <div>
              {/* {!keplrReady ? <h4>Sign into Keplr</h4> : <h4>Keplr Connected</h4>} */}
              <Button
                variant="contained"
                color="primary"
                size="medium"
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
          </Grid>

          <Grid item xs={6} md={6}>
            <div>
              {/* {!ethersReady ? <h4>Sign into MetaMask</h4> : <h4>MetaMask Connected</h4>} */}
              <Button
                variant="contained"
                color="primary"
                size="medium"
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
          </Grid>
          <Grid item xs={12} style={{marginTop: '2em', display: 'none'}}>
            <h1>{appStatusMessage}</h1>
          </Grid>
          {/* e grid item */}
        </Grid>
        {/* e grid cont */}


        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
              <div className={classes.boxStyle}>
                <div className="daoProfile">
                  <div className="daoLogo"></div>
                  <div className="daoName">Any Ethereum DAO</div>
                  <div className="daoMembers">6.4k members</div>
                  <Button variant="contained" color="primary" size="small" className="daoJoin">
                    Joined
                  </Button>
                <br /><br />
                <div className="daoMenu">
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={callApiTemp}
                    // className={signerAddressSecret ? classes.buttonNewGreen : classes.buttonNew}
                  >
                    Create Proposal
                  </Button>
                  {/* <button type="button" onClick={handleModalOpen}>pop modal</button> */}

                </div>
              </div>


              </div>
              {/* </ListItem> */}
            {/* </List> */}
          </Grid>
          <Grid item xs={12} sm={9}>

            <div className={classes.listHolder} style={{}}>
              <div className={classes.listBadge} style={{}}>
                <Chip label="Active" className={classes.green} />
              </div>
              <div className={classes.listContent} style={{}}>
                <div className={classes.listTitle}>Do we value privacy?</div>
                <p>Lorem Ipsum is simply Crypto Space citadel outputs when lambo Bitcoin Improvement Proposal blockchain full node price action? Inputs decentralized address consensus, public key hyperbitcoinization.</p>
                <div className={classes.voteButtons}>
                  <Button
                    variant="contained"
                    // style={{ backgroundColor: 'rgb(33 182 111)' }}
                    className={classes.buttonVote}
                    disabled={voteReady ? false : true}
                    onClick={increment}
                  >
                    Yes
                  </Button>
                  <Button
                    variant="contained"
                    style={{}}
                    className={classes.buttonVote}
                    disabled={voteReady ? false : true}
                    onClick={increment}
                  >
                    No
                  </Button>
                </div>
                <div className={classes.listVoteCount}>Votes: <b>{count}</b></div>
              </div>
            </div>



            <div className={classes.listHolder} style={{}}>
              <div className={classes.listBadge} style={{}}>
                <Chip label="Closed" className={classes.purple} />
              </div>
              <div className={classes.listContent} style={{}}>
                <div className={classes.listTitle}>Should we invest?</div>
                <p>Bitcoin ipsum dolor sit amet. Deflationary monetary policy genesis block inputs blocksize digital signature fee market sats blocksize freefall together? Consensus hodl stacking sats when lambo nonce blocksize fee market, halvening. </p>
                <div className={classes.voteScore}>
                  <div>Yes: 80%</div>
                  <BorderLinearProgress variant="determinate" value={80} /> 
                  <br />
                  <div>No: 20%</div>
                  <BorderLinearProgress variant="determinate" value={20} /> 
                </div>
              </div>
            </div>

            <div className={classes.listHolder} style={{}}>
              <div className={classes.listBadge} style={{}}>
                <Chip label="Closed" className={classes.purple} />
              </div>
              <div className={classes.listContent} style={{}}>
                <div className={classes.listTitle}>Partner with other DAOs?</div>
                <p>Deflationary monetary policy genesis block inputs blocksize digital signature fee market sats blocksize freefall together?</p>
                <div className={classes.voteScore}>
                  <div>Yes: 92%</div>
                  <BorderLinearProgress variant="determinate" value={92} /> 
                  <br />
                  <div>No: 9%</div>
                  <BorderLinearProgress variant="determinate" value={9} /> 
                </div>
              </div>
            </div>


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
    padding: theme.spacing(3)
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
    marginRight: '1em',
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
    marginTop: '2em',
    marginBottom: '2em'
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
