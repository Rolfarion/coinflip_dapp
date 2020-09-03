import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import Marketplace from './abis/Marketplace.json';

class App extends Component {
	//const marketplace 
	state = {
		account: '',
		fileCount: 0,
		files: [],
		loading: false
	};

	componentWillMount = async () => {
		await this.loadWeb3();
		await this.loadBlockChainData();
		await this.viewFile(0);
	}

	loadWeb3 = async () => {
		if (window.ethereum) {
			window.web3 = new Web3(window.ethereum);
			await window.ethereum.enable();
		}
		else if (window.web3) {
			window.web3 = new Web3(window.web3.currentProvider);
			await window.ethereum.enable();
		}
		else {
			window.alert("Non ethereum browser detected!!!!");
		}
	}

	loadBlockChainData = async () => {
		const web3 = window.web3;
		//load Account
		const accounts = await web3.eth.getAccounts();
		this.setState({ account: accounts[0] });
		const networkId = await web3.eth.net.getId();
		const networkData = Marketplace.networks[networkId];
		if (networkData) {
			const marketplace = new web3.eth.Contract(Marketplace.abi, networkData.address);
			this.setState({ marketplace });

			const fileCount = await marketplace.methods.fileCount().call();
			for (var i = 1; i <= fileCount; i++) {
				const file = await marketplace.methods.files(i).call();
				this.setState({
					files: [...this.state.files, file]
				});
			}
		}
		else {
			window.alert('Marketplace contract not deployed to detected network.');
		}

	}

	viewFile = async (id) => {
		this.setState({ loading: true });
		await this.state.marketplace.methods.viewFile(id).call();

		this.state.marketplace.events.FileViewed({
			fromBlock: 0,
			toBlock: 'latest'
		}, function (error, event) {
			if (error) {
				window.alert("Error: ", error);
			}
			else {
				console.log(event);
			}
		})
	}

	render = () => {
		return (
			<div>
				<h2>Marketplace Contract!!</h2>
			</div>
		);
	};
}

export default App;