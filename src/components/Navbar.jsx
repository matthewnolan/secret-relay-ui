import React from 'react';
import Link from 'next/link';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import {
  Brightness4Outlined as ToggleDarkModeIcon,
  Brightness5Outlined as ToggleLightModeIcon,
} from "@material-ui/icons/";
import { makeStyles, useTheme } from '@material-ui/core/styles';

import dynamic from "next/dynamic";
const ConnectWallet = dynamic(() => import("./ConnectWallet"), {
  ssr: false,
});

const Navbar = ({ toggleMode, darkMode }) => {
  const classes = useStyles();
  const theme = useTheme();

  // TODO CRUFT
  // function setProvider2(provider){
  //   console.log('stuff');
  // }

  return (
    <AppBar position="static" className={classes.root}>
      <Toolbar>
        {/* <img src="/logo.svg" alt="logo" className={classes.img} /> */}
        <Typography variant="h5" className={classes.title}  style={{ color: "green", marginRight: "1em" }} >
        Timber Network
        </Typography>

        <Typography variant="h5" className={classes.title}>
          🤫 The Secret Ballot DAO
        </Typography>


        <Typography variant="h6" className={classes.navitem}>
          <Link href="/">
            <a className={classes.navitemtext}>Home</a>
          </Link>
          <Link href="/relay">
            <a className={classes.navitemtext}>Relayer Demo</a>
          </Link>
          <Link href="/daopage">
            <a className={classes.navitemtext}>DAO Layout</a>
          </Link>
          <Link href="/about">
            <a className={classes.navitemtext}>About</a>
          </Link>
        </Typography>



        <IconButton
          edge="start"
          color="inherit"
          aria-label="mode"
          onClick={toggleMode}
          className={classes.toggleBtn}
        >
          {darkMode ? <ToggleLightModeIcon htmlColor={theme.custom.palette.iconColor} /> : <ToggleDarkModeIcon htmlColor={theme.custom.palette.iconColor} />}
        </IconButton>

        {/* <ConnectWallet setProvider={(provider) => setProvider2(provider)}  /> */}
        {/* <ConnectWallet /> */}
      </Toolbar>
    </AppBar>
  )
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    margin: 'auto',
    // maxWidth: 1100,
    boxShadow: 'none'
  },
  img: {
    width: 50,
    marginRight: 20
  },
  title: {
    marginLeft: 10,
    marginRight: 20,
    flexGrow: 0,
    fontWeight: 'bold',
    // color: '#784ffe',
    [theme.breakpoints.down('xs')]: {
      fontSize: 0,
      // display: 'none'
    },
  },
  navitem: {
    marginLeft: 1,
    flexGrow: 1,
    color: '#784ffe',
    [theme.breakpoints.down('xs')]: {
      fontSize: 0,
      // display: 'none'
    },
  },
  navitemtext: {
    marginLeft: 10,
    flexGrow: 1,
    color: '#fff',
    fontWeight: 'none',
    textDecoration: "none",
    "&:hover": {
      color: "#ffc107",
      textDecoration: "underline",
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: 0,
      // display: 'none'
    },
  },
  toggleBtn: {
    marginRight: 20,
    [theme.breakpoints.down('xs')]: {
      marginRight: 5,
    },
  }
}));


export default Navbar;