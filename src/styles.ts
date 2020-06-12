import {styled} from 'foliage'

/**
* -------------------------------------------------------------------------
* Стилизация
*/
export const Root = styled.div`
  display: flex;
  width: 500px;
  margin: 20px auto;
  padding: 20px;
  background-color: lightgray;
  flex-direction: column;
`

export const ButtonView = styled.button`
  padding: 5px;
  background-color: yellow;
  border: 1px solid gray;
  margin: 5px 0;

  &:disabled {
    opacity: 0.5;
  }
`

export const InputView = styled.div`
  position: relative;
  padding: 5px;
  border: 1px solid gray;
  margin: 5px 0;

  & > input {
    width: 100%;
    background-color: transparent;
    border: none;
  }
`

export const Icon = styled.div`
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);

  &[data-error] {
    background-color: red;
  }
`
