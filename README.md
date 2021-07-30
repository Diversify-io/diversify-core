# Diversify Smart Contracts

## Important Commands

- `hh console`
- `hh node`
- `hh test`



Sample ICO
```


    function buy() public payable returns(bool sucess) {
      require(msg.sender.balance >= msg.value && msg.value != 0 ether, "ICO: function buy invalid input");
      uint256 amount = msg.value * 1000;
      _transfer(owner(), _msgSender(), amount);
      return true;
    }


    ```