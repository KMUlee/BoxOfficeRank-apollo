import { ApolloServer, gql } from "apollo-server";
import fetch from "node-fetch";
import dotenv from "dotenv";
// To use .env
dotenv.config();
// Date fromat
const dateFormat = (y, m, d) =>
  y +
  m.toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false }) +
  d.toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false });
// API_KEY
const apikey = process.env.API_KEY;
const dbApiKey = process.env.DB_API_KEY;
// typeDefs gql
const typeDefs = gql`
  type otherDetails {
    vote_average: Float
    vote_count: Int
    poster_path: String
    overview: String!
    backdrop_path: String
  }

  type Movie {
    rnum: String!
    rank: String!
    rankInten: String!
    rankOldAndNew: String!
    movieCd: String!
    movieNm: String!
    openDt: String!
    salesAmt: String!
    salesShare: String!
    salesInten: String!
    salesChange: String!
    salesAcc: String!
    audiCnt: String!
    audiInten: String!
    audiChange: String!
    audiAcc: String!
    scrnCnt: String!
    showCnt: String!
    otherDetails: otherDetails
  }

  type Query {
    dailyBoxOffice(repNationCd: String, multiMovieYn: String): [Movie!]!
    weeklyBoxOffice(multiMovieYn: String, repNationCd: String): [Movie!]!
    movie(id: String!): Movie
  }
`;
// return details
const getMovieDetails = async (movieNm) => {
  return await (
    await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${dbApiKey}&language=ko&query=${movieNm}&page=1&include_adult=false`
    )
  )
    .json()
    .then((json) => json.results);
};
// Resolvers
const resolvers = {
  Query: {
    dailyBoxOffice(_, { repNationCd, multiMovieYn }) {
      console.log(multiMovieYn);
      let today = new Date();
      today.setDate(today.getDate() - 1);
      const targetDt = dateFormat(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );
      return fetch(
        `https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${apikey}&targetDt=${targetDt}&repNationCd=${
          repNationCd ? repNationCd : ""
        }&multiMovieYn=${multiMovieYn ? multiMovieYn : ""}`
      )
        .then((r) => r.json())
        .then((json) => json.boxOfficeResult.dailyBoxOfficeList);
    },
    weeklyBoxOffice(_, { repNationCd, multiMovieYn }) {
      let today = new Date();
      today.setDate(today.getDate() - 8);
      const targetDt = dateFormat(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );
      return fetch(
        `https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchWeeklyBoxOfficeList.json?key=${apikey}&targetDt=${targetDt}&repNationCd=${
          repNationCd ? repNationCd : ""
        }&multiMovieYn=${multiMovieYn ? multiMovieYn : ""}`
      )
        .then((r) => r.json())
        .then((json) => json.boxOfficeResult.weeklyBoxOfficeList);
    },
  },
  Movie: {
    async otherDetails({ movieNm }) {
      let mvNm = movieNm;
      let results;
      while (true) {
        results = await getMovieDetails(mvNm);
        if (results.length !== 0) {
          break;
        }
        mvNm = mvNm.substr(0, mvNm.length - 1);
      }
      results.sort(function (a, b) {
        return a.release_date < b.release_date;
      });
      return results[0];
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Running on ${url}`);
});
