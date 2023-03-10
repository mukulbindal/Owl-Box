import { Avatar, Box, Text } from "@chakra-ui/react";
import React from "react";

const ChatUser = ({ user, handler }) => {
  return (
    <Box
      onClick={() => {
        handler(user);
      }}
      cursor="pointer"
      backgroundColor="#eee"
      _hover={{
        background: "#444",
        color: "white",
      }}
      width="100%"
      display={"flex"}
      alignItems="center"
      color={"black"}
      paddingX={3}
      paddingY={2}
      borderRadius="lg"
      marginBottom={2}
    >
      <Avatar
        marginRight={2}
        size="sm"
        cursor={"pointer"}
        name={user.name}
        src={`/api/user/image/${user._id}`}
      ></Avatar>
      <Box>
        <Text>{user.name}</Text>
        <Text fontSize={"xs"}>
          <b>Email: </b>
          {user.email}
        </Text>
      </Box>
    </Box>
  );
};

export default ChatUser;
