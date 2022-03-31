import { app, h } from "hyperapp";
import { Link, Route, location } from "@hyperapp/router";
import { Products } from "./pages/products";
import { Sidebar } from "./pages/sidebar";
import { Participants } from "./pages/participants";
import { config } from "./config";
import { promisify } from "util";
import "./css/vendor/bootstrap.css";
import "./css/vendor/coreui.css";
import "./css/index.css";

const Fragment = (props, children) => children;

const Web3 = require("web3");
let web3js;

const ethEnabled = async () => {
  console.log("(window.ethereum", window.ethereum);
  if (window.ethereum) {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    window.web3 = new Web3(window.ethereum);
    return true;
  }
  return false;
};

ethEnabled();

if (typeof web3 !== "undefined") {
  web3js = new Web3(web3.currentProvider);
} else {
  web3js = new Web3("ws://localhost:7545");
}

import Main from "./contracts/Main.json";
import Session from "./contracts/Session.json";

const mainContract = new web3js.eth.Contract(Main.abi, config.mainContract);

var state = {
  count: 1,
  location: location.state,
  products: [],
  dapp: {},
  balance: 0,
  account: 0,
  admin: null,
  profile: null,
  fullname: "",
  email: "".replace,
  newProduct: {},
  sessions: [],
  currentProductIndex: 0,
};

const STATUS = {
  0: "CREATED",
  1: "STARTED",
  2: "CLOSING",
  3: "CLOSED",
};

// Functions of Main Contract
const contractFunctions = {
  getAccounts: promisify(web3js.eth.getAccounts),
  getBalance: promisify(web3js.eth.getBalance),

  // Get Admin address of Main contract
  getAdmin: mainContract.methods.admin().call,

  // Get participant by address
  participants: (address) => mainContract.methods.participants(address).call,

  // Get number of participants
  nParticipants: mainContract.methods.nParticipants().call,

  // Get address of participant by index (use to loop through the list of participants)
  iParticipants: (index) => mainContract.methods.iParticipants(index).call,

  // Register new participant
  register: async (fullname, email) => {
    const accounts = await web3js.eth.getAccounts();
    mainContract.methods.register(fullname, email).send({ from: accounts[0] });
  },

  // Get number of sessions
  nSessions: mainContract.methods.nSessions().call,

  // Get address of session by index (use to loop through the list of sessions)
  sessions: (index) => mainContract.methods.sessions(index).call,
};

const actions = {
  inputProfile:
    ({ field, value }) =>
    (state) => {
      let profile = state.profile || {};
      profile[field] = value;
      return {
        ...state,
        profile,
      };
    },

  inputNewProduct:
    ({ field, value }) =>
    (state) => {
      let newProduct = state.newProduct || {};
      newProduct[field] = value;
      return {
        ...state,
        newProduct,
      };
    },

  createProduct: () => async (state, actions) => {
    let contract = new web3js.eth.Contract(Session.abi, {
      data: Session.bytecode,
    });

    await contract
      .deploy({
        arguments: [
          mainContract.options.address,
          state.newProduct.name,
          state.newProduct.description,
          state.newProduct.image,
        ],
      })
      .send({ from: state.account });

    actions.getSessions();
  },

  selectProduct: (i) => (state) => {
    return {
      currentProductIndex: i,
    };
  },

  sessionFn:
    ({ action, price, contract }) =>
    async (state, {}) => {
      switch (action) {
        case "start":
          //TODO: Handle event when User Start a new session
          contract.methods.startSession().send({ from: state.account });
          break;
        case "stop":
          //TODO: Handle event when User Stop a session
          contract.methods.stopSession().send({ from: state.account });
          break;
        case "pricing":
          //TODO: Handle event when User Pricing a product
          //The inputed Price is stored in `data`
          contract.methods.proposePrice(price).send({ from: state.account });
          break;
        case "close":
          //TODO: Handle event when User Close a session
          //The inputed Price is stored in `data`
          contract.methods.closeSession(price).send({ from: state.account });
          break;
      }
    },

  location: location.actions,

  getAccount: () => async (state, actions) => {
    let accounts = await contractFunctions.getAccounts();
    let balance = await contractFunctions.getBalance(accounts[0]);
    let admin = await contractFunctions.getAdmin();
    let profile = await contractFunctions.participants(accounts[0])();

    actions.setAccount({
      account: accounts[0],
      balance,
      isAdmin: admin === accounts[0],
      profile,
    });
  },

  setAccount:
    ({ account, balance, isAdmin, profile }) =>
    (state) => {
      return {
        ...state,
        account: account,
        balance: balance,
        isAdmin: isAdmin,
        profile,
      };
    },

  getParticipants: () => async (state, actions) => {
    let participants = [];

    // TODO: Load all participants from Main contract.
    // One participant should contain { address, fullname, email, nSession and deviation }

    const nParticipants = await contractFunctions.nParticipants();

    for (let i = 0; i < nParticipants; i++) {
      const address = await contractFunctions.iParticipants(i)();
      const participant = await contractFunctions.participants(address)();

      participants.push({
        address: participant.account,
        fullname: participant.fullname,
        email: participant.email,
        nSessions: parseInt(participant.nSessions),
        deviation: parseInt(participant.deviation),
      });
    }

    actions.setParticipants(participants);
  },

  setParticipants: (participants) => (state) => {
    return {
      ...state,
      participants: participants,
    };
  },

  setProfile: (profile) => (state) => {
    return {
      ...state,
      profile: profile,
    };
  },

  register: () => async (state, actions) => {
    // TODO: Register new participant

    await contractFunctions.register(
      state.profile?.fullname,
      state.profile?.email
    );

    const profile = {
      email: state.profile?.email,
      fullname: state.profile?.fullname,
    };
    // TODO: And get back the information of created participant

    actions.setProfile(profile);
  },

  getSessions: () => async (state, actions) => {
    // TODO: Get the number of Sessions stored in Main contract
    let nSession = await contractFunctions.nSessions();
    let sessions = [];

    // TODO: And loop through all sessions to get information

    for (let index = 0; index < nSession; index++) {
      // Get session address
      let session = await contractFunctions.sessions(index)();

      // Load the session contract on network
      let contract = new web3js.eth.Contract(Session.abi, session);

      let id = session;

      // TODO: Load information of session.
      // Hint: - Call methods of Session contract to reveal all nessesary information
      //       - Use `await` to wait the response of contract
      let name = await contract.methods.name().call(); //TODO
      let description = await contract.methods.description().call(); // TODO
      let proposedPrice = await contract.methods.proposedPrice().call(); // TODO
      let finalPrice = await contract.methods.finalPrice().call(); // TODO
      let image = await contract.methods.image().call(); // TODO
      let status = await contract.methods.state().call();

      sessions.push({
        id,
        name,
        description,
        proposedPrice,
        finalPrice,
        contract,
        image,
        status: STATUS[status],
      });
    }
    actions.setSessions(sessions);
  },

  setSessions: (sessions) => (state) => {
    return {
      ...state,
      sessions: sessions,
    };
  },
};

const view = (
  state,
  { getAccount, getParticipants, register, inputProfile, getSessions }
) => {
  return (
    <body
      class="app sidebar-show sidebar-fixed"
      oncreate={() => {
        getAccount();
        getParticipants();
        getSessions();
      }}
    >
      <div class="app-body">
        <Sidebar
          balance={state.balance}
          account={state.account}
          isAdmin={state.isAdmin}
          profile={state.profile}
          register={register}
          inputProfile={inputProfile}
        ></Sidebar>
        <main class="main d-flex p-3">
          <div class="h-100  w-100">
            <Route path="/products" render={Products}></Route>
            <Route path="/participants" render={Participants}></Route>
          </div>
        </main>
      </div>
    </body>
  );
};
const el = document.body;

const main = app(state, actions, view, el);
const unsubscribe = location.subscribe(main.location);
